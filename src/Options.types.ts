/** Possible log levels */
export type LogLevel =
  | "silly"
  | "debug"
  | "verbose"
  | "info"
  | "warning"
  | "error";

export interface Options {
  /** Log level */
  log: LogLevel | "";
}
