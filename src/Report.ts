// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { Result } from "./lib/Checker.types";
import { Reporter } from "./Config.types";
import stripIndent from "strip-indent";
import indentString from "indent-string";

const TITLE = "Check SPDX headers";
export const ALL_VALID = "All files have valid headers.";

function getErrorsMarkdown(files: Result["files"]) {
  const lines = [];

  for (const file of files) {
    if (!file.valid) {
      lines.push(`- File: ${file.file}`);

      for (const rule of file.result) {
        if (!rule.valid) {
          lines.push(
            indentString(`- ${rule.rule}: ${rule.errors.join("\n")}`, 2),
          );
        }
      }
    }
  }

  return lines;
}

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

function validFilesMessage(validFiles: number): string {
  if (validFiles > 0) {
    return `✅ ${validFiles} ${pluralize(validFiles, "file")} have valid headers.`;
  }
  return "";
}

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

export function successReport(
  reporter: Reporter = "text",
  result: Result,
): string {
  switch (reporter) {
    case "json":
      return JSON.stringify({
        message: ALL_VALID,
        ...result,
      });
    case "markdown":
      return stripIndent(`
        *${TITLE}*

        ${validFilesMessage(result.validFiles)}
      `);
    default:
      return `${ALL_VALID}\nChecked ${result.checkedFiles} ${pluralize(result.checkedFiles, "file")}.`;
  }
}

export function errorReport(
  reporter: Reporter = "text",
  result: Result,
): string {
  const summary = `Checked ${result.checkedFiles} ${pluralize(result.checkedFiles, "file")}.\nFound ${result.errors.length} ${pluralize(result.errors.length, "error")} in ${result.invalidFiles} ${pluralize(result.invalidFiles, "file")}`;

  switch (reporter) {
    case "json":
      return JSON.stringify({
        message: summary.replace(/\n/g, " "),
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

export function getReport(reporter: Reporter, result: Result): string {
  return result.valid
    ? successReport(reporter, result)
    : errorReport(reporter, result);
}
