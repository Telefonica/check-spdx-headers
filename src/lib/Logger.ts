// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import winston from "winston";
const { combine, timestamp, json } = winston.format;

import type { LogLevel } from "./Logger.types";

export function createLogger(level?: LogLevel) {
  const logger = winston.createLogger({
    level: level || "info",
    format: combine(timestamp(), json()),
    transports: [new winston.transports.Console()],
  });
  return logger;
}
