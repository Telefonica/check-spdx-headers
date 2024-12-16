// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import * as core from "@actions/core";

import { Options } from "./Options.types";

function valueIfDefined<T = string>(value: T): T | undefined {
  return value === "" ? undefined : value;
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const log: Options["log"] = core.getInput("log") as Options["log"];

    // eslint-disable-next-line no-console
    console.log({
      log: valueIfDefined(log),
    });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
