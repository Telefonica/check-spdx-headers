// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

import { logLevelSchema } from "./Logger.types";

export const globPatternSchema = z.string();

/** Glob pattern to match files */
export type GlobPattern = z.infer<typeof globPatternSchema>;

export const licenseSchema = z.string();

/** License SPDX identifier */
export type License = z.infer<typeof licenseSchema>;

export const ignoreSchema = z.union([z.string(), z.array(z.string())]);

/** Ignore the files */
export type Ignore = z.infer<typeof ignoreSchema>;

export const ruleHeadersSchema = z
  .object({
    files: z.union([globPatternSchema, z.array(globPatternSchema)]),
    license: z.union([licenseSchema, z.array(licenseSchema)]).optional(),
    ignore: ignoreSchema.optional(),
    copyright: z.string().optional(),
  })
  .strict();

/**
 * Details about the headers that a set of files must have
 */
export type RuleHeaders = z.infer<typeof ruleHeadersSchema>;

export const ruleSchema = z.object({
  name: z.string(),
  headers: z.array(ruleHeadersSchema),
  ignore: ignoreSchema.optional(),
});

/**
 * Set of file headers to check
 */
export type Rule = z.infer<typeof ruleSchema>;

export const configSchema = z
  .object({
    rules: z.array(ruleSchema),
    log: logLevelSchema.optional(),
    ignore: ignoreSchema.optional(),
  })
  .strict();

/** Options **/
export type Config = z.infer<typeof configSchema>;
