import * as core from "@actions/core";
import { parse } from "yaml";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { inputOptionsSchema } from "./Options.types";
import type { InputOptions } from "./Options.types";
import { fromError } from "zod-validation-error";

/**
 * Returns the value if it is defined, otherwise returns undefined.
 * @param value The value to check.
 * @returns The value if it is defined, otherwise undefined.
 */
function valueIfDefined<T = string>(value: T): T | undefined {
  return value === "" ? undefined : value;
}

/**
 * Returns the boolean value if it is defined, otherwise returns undefined.
 * @param value The value to check.
 * @returns The boolean value if it is defined, otherwise undefined.
 */
function valueIfBoolean(value: string): boolean | undefined {
  if (value === "") {
    return undefined;
  }
  /*
   * NOTE: Using core.getInputBoolean() would be better, but it seems to not be working properly.
   * I assigned a default value of true in the action.yml file, but it does not work as expected, at least in the action debugger.
   * To be verified.
   */
  if (!(value in ["true", "True", "TRUE", "false", "False", "FALSE"])) {
    throw new Error("Invalid boolean value");
  }
  return value in ["true", "True", "TRUE"];
}

/**
 * Returns the inputs from the action.
 * @returns The inputs from the action.
 */
function getInputs() {
  const headers = core.getMultilineInput("headers").join("\n");
  const log = core.getInput("log");
  const failOnError = core.getInput("failOnError");
  const reporter = core.getInput("reporter");
  const config = core.getMultilineInput("config").join("\n");
  const configFile = core.getInput("configFile");

  const inputs = {
    headers: valueIfDefined(headers),
    log: valueIfDefined(log),
    failOnError: valueIfBoolean(failOnError),
    reporter: valueIfDefined(reporter),
    config: valueIfDefined(config),
    configFile: valueIfDefined(configFile),
  };

  (Object.keys(inputs) as (keyof typeof inputs)[]).forEach((key) => {
    if (inputs[key] === undefined) {
      delete inputs[key];
    }
  });

  // TODO: Log the inputs from the action

  return inputs;
}

/**
 * Parses a YAML configuration
 * @param config The configuration to parse
 * @returns The parsed configuration
 */
function parseYamlConfig(config: string) {
  return parse(config);
}

async function loadConfigFile(configFile: string) {
  const fileExists = existsSync(configFile);
  if (fileExists) {
    const config = await readFile(configFile, "utf8");
    return parseYamlConfig(config);
  }
  // TODO: Add log about the file not existing
  return {};
}

/**
 * Returns the options from the action inputs, loading configuration files if needed and parsing the inputs accordingly.
 * @returns The options from the action inputs and configuration files.
 */
export async function getOptions(): Promise<InputOptions> {
  const inputs = getInputs();
  let config: Partial<InputOptions> = {};
  let configFromFile: Partial<InputOptions> = {};
  let parsedInputs: Partial<InputOptions> = {};

  if (inputs.config) {
    // TODO: Add log about the configuration being loaded
    config = parseYamlConfig(inputs.config);
  }

  if (inputs.headers) {
    // TODO: Add log about parsing the check object from the inputs
    parsedInputs.headers = parseYamlConfig(inputs.headers);
  }

  // TODO: Add log about the configuration being loaded
  configFromFile = await loadConfigFile(
    inputs.configFile || "check-license-headers.config.yml",
  );

  const mergedConfig = {
    ...configFromFile,
    ...config,
    ...inputs,
    ...parsedInputs,
  };

  // eslint-disable-next-line no-console
  console.log({ configFromFile, config, inputs, parsedInputs, mergedConfig });

  const mergedConfigWithDefaults = {
    ...mergedConfig,
    log: mergedConfig.log || "info",
    failOnError: mergedConfig.failOnError || true,
    reporter: mergedConfig.reporter || "text",
  };

  const result = inputOptionsSchema.safeParse(mergedConfigWithDefaults);

  if (!result.success) {
    throw new Error(fromError(result.error).toString());
  }

  return result.data;
}
