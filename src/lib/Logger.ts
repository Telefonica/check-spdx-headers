// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import winston from "winston";
import chalk from "chalk";
const { combine, colorize, timestamp, printf } = winston.format;

import type { LogLevel } from "./Logger.types";

function printExtraInfo(info: winston.Logform.TransformableInfo) {
  const objectToPrint: Record<string, unknown> = {};

  for (const key in info) {
    if (key !== "message" && key !== "level" && key !== "timestamp") {
      objectToPrint[key] = info[key];
    }
  }
  if (Object.keys(objectToPrint).length === 0) {
    return "";
  }

  return `: ${chalk.gray(JSON.stringify(objectToPrint))}`;
}

export function createLogger(level?: LogLevel) {
  const logger = winston.createLogger({
    level: level || "info",
    format: combine(
      colorize(),
      timestamp(),
      printf(
        (info) =>
          `${info.timestamp} ${info.level}: ${info.message}${printExtraInfo(info)}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });
  return logger;
}
