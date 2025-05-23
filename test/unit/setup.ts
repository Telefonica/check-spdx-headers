// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
jest.mock<typeof import("strip-indent")>("strip-indent", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((text) => text),
}));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
jest.mock<typeof import("indent-string")>("indent-string", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((text) => text),
}));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
jest.mock<typeof import("chalk")>("chalk", () => ({
  gray: jest.fn().mockImplementation((text) => text),
}));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
jest.mock<typeof import("spdx-satisfies")>("spdx-satisfies", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => true),
}));
