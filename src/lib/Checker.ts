// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { glob } from "glob";
import winston from "winston";
import { Config, RuleHeaders, Rule, Ignore } from "./Config.types";
import {
  Result,
  RuleResult,
  FileRuleResult,
  FileRulesResults,
  FileError,
} from "./Checker.types";
import { createLogger } from "./Logger";
import { readFile, stat } from "fs/promises";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import satisfies from "./spdx-satisfies/index";

/**
 * Check files for license headers
 */
export class Checker {
  private _logger: winston.Logger;
  private _config: Config;

  /**
   * Create a new checker
   * @param options Options for the checker
   */
  constructor(config: Config) {
    this._logger = createLogger(config.log);
    this._config = config;
    this._logger.verbose("Checker created with config", config);
  }

  /**
   * Get the logger
   */
  public get logger() {
    return this._logger;
  }

  /**
   * Get the SPDX header from a file content
   * @param fileContent the content of the file
   * @param headerName The name of the header to get
   * @returns The value of the header or null if it does not exist
   */
  private _getSPDXHeader(
    fileContent: string,
    headerName: string,
  ): string | null {
    const headerRegex = new RegExp(`SPDX-${headerName}: (.*)$`, "m");

    const match = fileContent.match(headerRegex);

    if (match) {
      return match[1];
    }

    return null;
  }

  /**
   * Check the license of a file
   * @param file The file path to check
   * @param license The approved license or licenses
   * @returns An error message if the license is not valid or null if it is valid
   */
  private async _checkFileLicense(
    file: string,
    license: string | string[],
  ): Promise<string | null> {
    this._logger.silly(`Checking file license`, { file, license });
    const stats = await stat(file);

    if (stats.isFile()) {
      const fileContent = await readFile(file, "utf-8");

      const spdxLicense = this._getSPDXHeader(
        fileContent,
        "License-Identifier",
      );

      if (!spdxLicense) {
        const message = `Does not have a license header`;
        this.logger.debug(`File "${file}" ${message.toLowerCase()}`);
        return message;
      }

      const approvedLicenses = Array.isArray(license) ? license : [license];

      try {
        if (!satisfies(spdxLicense, approvedLicenses)) {
          const message = `License ${spdxLicense} does not satisfy ${approvedLicenses.join(", ")}`;
          this.logger.debug(`${message} in file "${file}"`);
          return message;
        }
      } catch (error) {
        const message = `Error checking license: ${(error as Error).message}. Is the license a valid SPDX id?`;
        this.logger.error(`${message} in file "${file}"`);
        return message;
      }
    }

    return null;
  }

  /**
   * Check the copyright of a file
   * @param file The file path to check
   * @param license The approved copyright or copyrights
   * @returns An error message if the copyright is not valid or null if it is valid
   */
  private async _checkFileCopyright(
    file: string,
    copyright: string | string[],
  ): Promise<string | null> {
    this._logger.silly(`Checking file copyright`, { file, copyright });

    const fileContent = await readFile(file, "utf-8");

    const spdxCopyright = this._getSPDXHeader(fileContent, "FileCopyrightText");

    if (!spdxCopyright) {
      const message = `Does not have a copyright`;
      this.logger.debug(`File "${file}" ${message.toLowerCase()}`);
      return message;
    }

    const approvedCopyrights = Array.isArray(copyright)
      ? copyright
      : [copyright];

    if (!approvedCopyrights.length) {
      return null;
    }

    const matches = approvedCopyrights.some((approvedCopyright) => {
      const matcher = new RegExp(`^${approvedCopyright}$`);
      if (!matcher.test(spdxCopyright)) {
        return false;
      }
      return true;
    });

    if (!matches) {
      const message = `Does not have the expected copyright`;
      this.logger.debug(`File "${file}" ${message.toLowerCase()}`);
      return message;
    }

    return null;
  }

  /**
   * Check a file for a rule
   * @param file The file to check
   * @param headers The headers to check
   * @param rule The rule name
   * @returns An object with the result of the check
   */
  private async _checkFile(
    file: string,
    headers: RuleHeaders,
    rule: string,
  ): Promise<FileRuleResult> {
    this._logger.debug(`Checking rule "${rule}" in file "${file}"`);
    const checkPromises = [];
    if (headers.license) {
      checkPromises.push(this._checkFileLicense(file, headers.license));
    }
    if (headers.copyright) {
      checkPromises.push(this._checkFileCopyright(file, headers.copyright));
    }
    const result = await Promise.all(checkPromises);

    if (result.some((r) => r !== null)) {
      const resultToReturn = {
        rule,
        file,
        errors: result.filter((r) => r !== null),
        valid: false,
      };
      this._logger.warn(`Errors found in file "${file}"`, resultToReturn);
      return resultToReturn;
    }

    return {
      rule,
      file,
      errors: [],
      valid: true,
    };
  }

  /**
   * Check the headers of a rule
   * @param filesHeaders The headers to check
   * @param ruleName The name of the rule
   * @param headersIndex The index of the headers in the rule, used for reporting and debugging
   * @param ignore The ignore patterns
   * @returns An object with the result of the check
   */
  private async _checkRuleHeaders(
    filesHeaders: RuleHeaders,
    ruleName: string,
    headersIndex: number,
    ignore?: Ignore,
  ): Promise<RuleResult> {
    let globPatterns = Array.isArray(filesHeaders.files)
      ? filesHeaders.files
      : [filesHeaders.files];

    const mergedIgnore = [...(filesHeaders.ignore || []), ...(ignore || [])];

    const headersName = `headers ${headersIndex + 1}`;

    this._logger.debug(`Config for ${headersName} of rule "${ruleName}`, {
      ...filesHeaders,
      files: globPatterns,
      ignore: mergedIgnore,
    });

    const files = await glob(globPatterns, { ignore: mergedIgnore });
    const checkPromises = [];

    for (const file of files) {
      checkPromises.push(this._checkFile(file, filesHeaders, ruleName));
    }

    const result = await Promise.all(checkPromises);

    const flatResult = {
      rule: ruleName,
      valid: result.every((r) => r.valid),
      // Combine the errors of the same file
      result: result.reduce((acc, r) => {
        const existingFile = acc.find((f) => f.file === r.file);

        if (existingFile) {
          existingFile.errors.push(...r.errors);
        } else {
          acc.push(r);
        }

        return acc;
      }, [] as FileRuleResult[]),
    };

    this._logger.debug(
      `Result of ${headersName} in rule "${ruleName}"`,
      flatResult,
    );

    return flatResult;
  }

  /**
   * Combine the results of the rules for a single file
   * @param results The results of the rules
   * @returns An array with the combined results for a single file
   */
  private _combineFileRuleResults(results: RuleResult[]): RuleResult["result"] {
    const combinedResult: RuleResult["result"] = [];

    for (const result of results) {
      // Method that checks if any element in the results has a file that is already in the combinedResult
      const fileExists = (file: string) =>
        combinedResult.some((r) => r.file === file);

      for (const fileResult of result.result) {
        if (fileExists(fileResult.file)) {
          const existingFile = combinedResult.find(
            (r) => r.file === fileResult.file,
          );
          if (existingFile) {
            existingFile.errors = [
              ...existingFile.errors,
              ...fileResult.errors,
            ];
          }
        } else {
          combinedResult.push(fileResult);
        }
      }
    }

    return combinedResult;
  }

  /**
   * Combine the results of the rules for all files
   * @param results The results of the rules
   * @returns An array with the combined results for all files
   */
  private _combineFileRulesResults(results: RuleResult[]): FileRulesResults[] {
    const combinedResult: FileRulesResults[] = [];

    for (const result of results) {
      for (const fileResult of result.result) {
        const existingFile = combinedResult.find(
          (r) => r.file === fileResult.file,
        );

        if (existingFile) {
          existingFile.result.push({
            rule: result.rule,
            errors: fileResult.errors,
            valid: fileResult.errors.length === 0,
          });
        } else {
          combinedResult.push({
            file: fileResult.file,
            valid: fileResult.valid,
            result: [
              {
                rule: result.rule,
                errors: fileResult.errors,
                valid: fileResult.errors.length === 0,
              },
            ],
          });
        }
      }
    }

    // Change the is valid to false if any of the rules is invalid
    for (const file of combinedResult) {
      file.valid = file.result.every((r) => r.errors.length === 0);
    }

    return combinedResult;
  }

  /**
   * Combine the errors of all files
   * @param filesResults The results of the files
   * @returns An array with all the errors of all files
   */
  private _combineErrors(filesResults: FileRulesResults[]): FileError[] {
    const errors: FileError[] = [];

    for (const file of filesResults) {
      for (const rule of file.result) {
        for (const error of rule.errors) {
          errors.push({
            file: file.file,
            rule: rule.rule,
            error,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Checks a single rule
   * @param rule The rule to check
   * @returns An object with the result of the check
   */
  private async _checkRule(rule: Rule): Promise<RuleResult> {
    this._logger.info(`Checking rule "${rule.name}"`);

    let ignore: Rule["ignore"] = undefined;

    if (rule.ignore) {
      ignore = Array.isArray(rule.ignore) ? rule.ignore : [rule.ignore];
    }
    if (this._config.ignore) {
      ignore = ignore
        ? [...ignore, ...this._config.ignore]
        : this._config.ignore;
    }

    this._logger.debug(`Rule "${rule.name}" config`, {
      ...rule,
      ignore,
    });

    const checkPromises = [];

    let i = 0;

    for (const header of rule.headers) {
      checkPromises.push(this._checkRuleHeaders(header, rule.name, i, ignore));
      i++;
    }

    const results = await Promise.all(checkPromises);

    const flatResult = {
      rule: rule.name,
      valid: results.every((r) => r.valid),
      result: this._combineFileRuleResults(results),
    };

    this.logger.debug(`Result of rule "${rule.name}"`, flatResult);

    return flatResult;
  }

  /**
   * Checks all rules
   * @returns An object with the result of the check
   */
  public async check(): Promise<Result> {
    this._logger.info("Checking file headers");
    const rules = [...this._config.rules].reverse();

    const checkPromises = [];

    for (const rule of rules) {
      checkPromises.push(this._checkRule(rule));
    }

    const result = await Promise.all(checkPromises);

    const combinedResult = this._combineFileRulesResults(result);

    const flatResult: Result = {
      valid: result.every((r) => r.valid),
      rules: result,
      files: combinedResult,
      errors: this._combineErrors(combinedResult),
      checkedFiles: combinedResult.length,
      validFiles: combinedResult.filter((f) => f.valid).length,
      invalidFiles: combinedResult.filter((f) => !f.valid).length,
    };

    this.logger.debug("Result of all rules", flatResult);

    return flatResult;
  }
}
