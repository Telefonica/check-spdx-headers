import { z } from "zod";

import { optionsSchema } from "./lib/Check.types";

export const reporterSchema = z.enum(["json", "markdown", "text"]).optional();
/** Formatter of the response */
export type Reporter = z.infer<typeof reporterSchema>;

export const failOnErrorSchema = z.boolean().optional();
/** Fail on error */
export type FailOnError = z.infer<typeof failOnErrorSchema>;

export const inputOptionsSchema = z
  .object({
    ...optionsSchema.shape,
    reporter: reporterSchema,
    failOnError: failOnErrorSchema,
  })
  .strict();

/** Input options */
export type InputOptions = z.infer<typeof inputOptionsSchema>;
