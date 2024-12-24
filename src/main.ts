// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import * as core from "@actions/core";

import { getConfig } from "./Config";
import { Checker } from "./lib/index";

import { getReport } from "./Report";

const FAILED_MESSAGE = "Some files do not have valid SPDX headers";
const OUTPUT_REPORT = "report";
const OUTPUT_VALID = "valid";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.debug("Getting configuration...");
    const options = await getConfig();

    core.debug("Running checker...");
    const checker = new Checker({
      rules: options.rules,
      log: options.log,
      ignore: options.ignore,
    });
    const result = await checker.check();

    const report = getReport(options.reporter, result);
    core.info(report);
    core.setOutput(OUTPUT_REPORT, report);
    core.setOutput(OUTPUT_VALID, result.valid);

    if (!result.valid) {
      if (options.failOnError) {
        core.setFailed(FAILED_MESSAGE);
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.error(error as Error);
    if (error instanceof Error) core.setFailed(error.message);
  }
}
