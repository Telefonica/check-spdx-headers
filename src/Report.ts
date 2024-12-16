// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { Result } from "./lib/Checker.types";
import { Reporter } from "./Config.types";
import stripIndent from "strip-indent";
import indentString from "indent-string";

const TITLE = "Check SPDX headers";
export const ALL_VALID = "All files have valid headers.";

/**
 * Get the errors in a markdown format
 * @param files The files to get the errors from
 * @returns The errors in markdown format
 */
function getErrorsMarkdown(files: Result["files"]) {
  const lines = [];

  for (const file of files) {
    if (!file.valid) {
      lines.push(`- File: ${file.file}`);

      for (const rule of file.result) {
        if (!rule.valid) {
          if (rule.errors.length === 1) {
            lines.push(indentString(`- ${rule.rule}: ${rule.errors[0]}`, 2));
          } else {
            lines.push(indentString(`- ${rule.rule}:`, 2));
            for (const error of rule.errors) {
              lines.push(indentString(`- ${error}`, 4));
            }
          }
        }
      }
    }
  }

  return lines;
}

/**
 * Return the text of the errors, grouped by file
 * @param files The files to get the errors from
 * @returns The text detailing the errors by file
 */
function getErrorsText(files: Result["files"]) {
  const fileReports = [];

  for (const file of files) {
    const fileReport = [];
    if (!file.valid) {
      fileReport.push(`File '${file.file}':`);

      for (const rule of file.result) {
        if (!rule.valid) {
          fileReport.push(`${rule.errors.join(". ")}.`);
        }
      }
      fileReports.push(fileReport.join(" "));
    }
  }

  return fileReports.join("\n");
}

/**
 * Pluralize a word by adding an 's' at the end
 * @param count Number to check
 * @param singular Singular form of the word
 * @returns The word pluralized
 */
function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

/**
 * Get a message with the number of valid files
 * @param validFiles Number of valid files
 * @returns The message
 */
function validFilesMessage(validFiles: number): string {
  if (validFiles > 0) {
    return `✅ ${validFiles} ${pluralize(validFiles, "file")} have valid headers.`;
  }
  return "";
}

/**
 * Replace new lines with spaces
 * @param text Text to remove new lines from
 * @returns The text without new lines
 */
function removeBlankLines(text: string): string {
  return text.replace(/\n/gm, " ");
}

/**
 * Report a successful check
 * @param reporter The reporter to use
 * @param result The result of the check
 * @returns The report in the specified format
 */
export function successReport(reporter: Reporter, result: Result): string {
  const summary = `Checked ${result.checkedFiles} ${pluralize(result.checkedFiles, "file")}.\n${ALL_VALID}`;
  switch (reporter) {
    case "json":
      return JSON.stringify({
        message: removeBlankLines(summary),
        ...result,
      });
    case "markdown":
      return stripIndent(`
        __${TITLE}__

        ${validFilesMessage(result.validFiles)}
      `);
    default:
      return summary;
  }
}

/**
 * Report a failed check
 * @param reporter The reporter to use
 * @param result The result of the check
 * @returns The report in the specified format
 */
export function errorReport(reporter: Reporter, result: Result): string {
  const summary = `Checked ${result.checkedFiles} ${pluralize(result.checkedFiles, "file")}.\nFound ${result.errors.length} ${pluralize(result.errors.length, "error")} in ${result.invalidFiles} ${pluralize(result.invalidFiles, "file")}`;

  switch (reporter) {
    case "json":
      return JSON.stringify({
        message: removeBlankLines(summary),
        ...result,
      });
    case "markdown":
      return stripIndent(`
        __${TITLE}__

        Checked ${result.checkedFiles} ${pluralize(result.checkedFiles, "file")}.
        
        ${validFilesMessage(result.validFiles)}
        ❌ Found ${result.errors.length} ${pluralize(result.errors.length, "error")} in ${result.invalidFiles} ${pluralize(result.invalidFiles, "file")}:

        ${getErrorsMarkdown(result.files)
          .map((line, index) => (index > 0 ? indentString(line, 8) : line))
          .join("\n")}
      `);
    default:
      return `${summary}:\n${getErrorsText(result.files)}`;
  }
}

/**
 * Get the report in the specified format
 * @param reporter The reporter to use
 * @param result The result of the check
 * @returns The report in the specified format
 */
export function getReport(reporter: Reporter, result: Result): string {
  return result.valid
    ? successReport(reporter, result)
    : errorReport(reporter, result);
}
