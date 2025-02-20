// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

/** Error in a checked file */
export interface FileError {
  /** The rule producing the error */
  rule: string;
  /** File path */
  file: string;
  /** Error messages */
  error: string;
}

/** Error in a checked file */
export interface FileRuleResult {
  /** The rule producing the error */
  rule: string;
  /** File path */
  file: string;
  /** Whether the file is valid or not */
  valid: boolean;
  /** Error messages */
  errors: string[];
}

/**
 * The result of the check
 */
export interface RuleResult {
  /** Rule name */
  rule: string;
  /**
   * Whether all the files have valid headers
   */
  valid: boolean;
  /**
   * Errors in the files
   */
  result: Omit<FileRuleResult, "rule">[];
}

/** Errors in a checked file */
export interface FileRulesResults {
  /** File path */
  file: string;
  /** Whether the file is valid or not */
  valid: boolean;
  /** Errors grouped by rule */
  result: Omit<FileRuleResult, "file">[];
}

/**
 * The result of the check
 */
export interface Result {
  /**
   * Whether all the files have valid headers
   */
  valid: boolean;

  /**
   * Number of files checked
   */
  checkedFiles: number;

  /**
   * Number of files with valid headers
   */
  validFiles: number;

  /**
   * Number of files with invalid headers
   */
  invalidFiles: number;

  /**
   * Errors in the files
   */
  errors: FileError[];

  /**
   * Results grouped by rule
   */
  rules: RuleResult[];

  /** Results grouped by file */
  files: FileRulesResults[];
}
