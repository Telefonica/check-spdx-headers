// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

import { configSchema, ignoreSchema } from "./lib/Config.types";

export const reporterSchema = z.enum(["json", "markdown", "text"]).optional();
/** Formatter of the response */
export type Reporter = z.infer<typeof reporterSchema>;

export const failOnErrorSchema = z.boolean().optional();
/** Fail on error */
export type FailOnError = z.infer<typeof failOnErrorSchema>;

export const inputOptionsSchema = z
  .object({
    ...configSchema.shape,
    reporter: reporterSchema,
    failOnError: failOnErrorSchema,
    ignore: ignoreSchema,
    configFile: z.string().optional(),
    config: z.string().optional(),
  })
  .strict();

/** Input options */
export type InputOptions = z.infer<typeof inputOptionsSchema>;
