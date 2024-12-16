import { z } from "zod";

export const logLevelSchema = z.enum([
  "silly",
  "debug",
  "verbose",
  "info",
  "warning",
  "error",
]);

/** Possible log levels */
export type LogLevel = z.infer<typeof logLevelSchema>;

export const globPatternSchema = z.string();

/** Glob pattern to match files */
export type GlobPattern = z.infer<typeof globPatternSchema>;

export const licenseSchema = z.string();

/** License SPDX identifier */
export type License = z.infer<typeof licenseSchema>;

export const ignoreSchema = z.boolean();

/** Ignore the files */
export type Ignore = z.infer<typeof ignoreSchema>;

export const filesCheckerSchema = z
  .object({
    files: z.union([globPatternSchema, z.array(globPatternSchema)]),
    license: z.union([licenseSchema, z.array(licenseSchema)]).optional(),
    ignore: ignoreSchema.optional(),
  })
  .strict();

/**
 * Details about the license or licenses that a set of files must have
 */
export type FilesChecker = z.infer<typeof filesCheckerSchema>;

export const optionsSchema = z
  .object({
    headers: z.array(filesCheckerSchema),
    log: logLevelSchema.optional(),
  })
  .strict();

/** Options **/
export type Options = z.infer<typeof optionsSchema>;

/** Error in a checked file */
export type FileError = {
  /** File path */
  file: string;
  /** Error message */
  error: string;
};

/**
 * The result of the check
 */
export interface Result {
  /**
   * Whether all the files have a valid license
   */
  valid: boolean;
  /**
   * Errors in the files
   */
  errors: FileError[];
}
