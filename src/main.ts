// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import * as core from "@actions/core";

import { getOptions } from "./Options";
import { check } from "./lib/Check";

import { successReport } from "./Report";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const options = await getOptions();
    const result = await check({
      headers: options.headers,
      log: options.log,
    });

    if (!result.valid) {
      core.setOutput("report", successReport(options.reporter));
      if (options.failOnError) {
        core.setFailed("Some files do not have a valid license");
      }
    } else {
      core.info(successReport());
      core.setOutput("report", successReport(options.reporter));
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
