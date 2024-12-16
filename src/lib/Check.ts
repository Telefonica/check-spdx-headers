import type { Options, Result } from "./Check.types";

export function check(options: Options): Promise<Result> {
  // eslint-disable-next-line no-console
  console.log("Checking files with options:", options);
  return Promise.resolve({ valid: true, errors: [] });
}
