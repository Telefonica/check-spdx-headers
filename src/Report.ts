import { Result } from "./lib/Check.types";
import { Reporter } from "./Options.types";
import stripIndent from "strip-indent";

const TITLE = "Check license headers";
const ALL_VALID = "All files have a valid license";

export function successReport(reporter: Reporter = "text"): string {
  switch (reporter) {
    case "json":
      return JSON.stringify({ valid: true, errors: [], message: ALL_VALID });
    case "markdown":
      return stripIndent(`
        *${TITLE}*

        ✅ ${ALL_VALID}
      `);
    default:
      return ALL_VALID;
  }
}

export function errorReport(
  reporter: Reporter = "text",
  result: Result,
): string {
  const summary = `${result.errors.length} file${result.errors.length > 0 ? "s" : ""} do not have a valid license`;

  switch (reporter) {
    case "json":
      return JSON.stringify({
        message: summary,
        ...result,
      });
    case "markdown":
      return stripIndent(`
        *${TITLE}*

        ❌ ${summary}:

        ${result.errors
          .map(
            (error) =>
              `  - \`${error.file.replace(process.cwd(), "")}\`: ${error.error}`,
          )
          .join("\n")}
      `);
    default:
      return summary;
  }
}
