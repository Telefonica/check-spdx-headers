// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import * as core from "@actions/core";

import { getConfig } from "./Config";
import { Checker } from "./lib/index";

import { errorReport, successReport, ALL_VALID } from "./Report";

const FAILED_MESSAGE = "Some files do not have a valid license";
const OUTPUT_REPORT = "report";

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

    if (!result.valid) {
      core.info(FAILED_MESSAGE);
      core.setOutput(OUTPUT_REPORT, errorReport(options.reporter, result));
      if (options.failOnError) {
        core.setFailed(FAILED_MESSAGE);
      }
    } else {
      core.info(ALL_VALID);
      core.setOutput(OUTPUT_REPORT, successReport(options.reporter, result));
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
