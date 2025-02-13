// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { PathLike } from "fs";
import { stat, readFile, FileHandle } from "fs/promises";

import { glob } from "glob";
import satisfies from "spdx-satisfies";

import { Checker } from "../../../src/lib/index";

jest.mock<typeof import("glob")>("glob", () => ({
  ...jest.requireActual("glob"),
  glob: jest.fn().mockImplementation(async () => {
    return [];
  }) as unknown as typeof import("glob").glob,
}));

jest.mock<typeof import("fs/promises")>("fs/promises", () => ({
  ...jest.requireActual("fs/promises"),
  readFile: jest.fn().mockResolvedValue(
    `
rules: []
    `,
  ),
  stat: jest.fn().mockResolvedValue({
    isFile: () => true,
  }),
}));

describe("checker", () => {
  let isFileMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    isFileMock = jest.fn().mockReturnValue(true);
    jest.mocked(stat).mockResolvedValue({
      isFile: isFileMock,
    } as unknown as ReturnType<typeof stat>);

    // NOTE: Mock satisfies library. Return true only when they are equal
    jest.mocked(satisfies).mockImplementation(
      //@ts-expect-error The library types are not correct. It should accept an array of licenses
      (licenseFound: string, allowedLicenses: string[]): boolean => {
        return allowedLicenses.includes(licenseFound);
      },
    );
  });

  describe("check method result", () => {
    it("should be valid when no rules are defined", async () => {
      const checker = new Checker({
        log: "error",
        rules: [],
      });

      const result = await checker.check();

      expect(result.valid).toBe(true);
    });

    it("should be valid when all files have valid headers", async () => {
      const checker = new Checker({
        log: "error",
        rules: [
          {
            name: "Rule 1",
            headers: [
              {
                files: "**/*.ts",
                license: "Apache-2.0",
                copyright: "\\d{4}(\\s-\\s\\d{4})? Copyright Holder",
              },
            ],
            ignore: ["node_modules"],
          },
        ],
      });

      jest.mocked(glob).mockResolvedValue(["file.ts"]);
      jest.mocked(readFile).mockResolvedValue(`
        // SPDX-License-Identifier: Apache-2.0
        // SPDX-FileCopyrightText: 2024 Copyright Holder`);

      const result = await checker.check();

      expect(result.valid).toBe(true);
    });

    it("should not be valid when one file have invalid headers", async () => {
      const checker = new Checker({
        log: "error",
        rules: [
          {
            name: "Rule 1",
            headers: [
              {
                files: "**/*.ts",
                license: ["Apache-2.0"],
                copyright: "\\d{4}(\\s-\\s\\d{4})? Copyright Holder",
              },
            ],
          },
        ],
      });

      jest
        .mocked(glob)
        .mockResolvedValue([
          "file-1.ts",
          "file-2.ts",
          "file-3.ts",
          "file-4.ts",
          "file-5.ts",
        ]);
      jest
        .mocked(readFile)
        .mockImplementation(async (path: PathLike | FileHandle) => {
          if (path === "file-1.ts") {
            return `
          // SPDX-License-Identifier: Apache-2.0
          // SPDX-FileCopyrightText: 2024 Copyright Holder
          `;
          }
          if (path === "file-2.ts") {
            return "// SPDX-FileCopyrightText: 2024 Copyright Holder";
          }
          if (path === "file-3.ts") {
            return "// SPDX-License-Identifier: Apache-2.0";
          }
          if (path === "file-4.ts") {
            return "// SPDX-License-Identifier: MIT";
          }
          return "// SPDX-FileCopyrightText: Foo Holder";
        });

      const result = await checker.check();

      expect(result).toEqual({
        valid: false,
        rules: [
          {
            rule: "Rule 1",
            valid: false,
            result: [
              { file: "file-1.ts", errors: [], valid: true },
              {
                file: "file-2.ts",
                errors: ["Does not have a license header"],
                valid: false,
              },
              {
                file: "file-3.ts",
                errors: ["Does not have a copyright"],
                valid: false,
              },
              {
                file: "file-4.ts",
                errors: [
                  "License MIT does not satisfy Apache-2.0",
                  "Does not have a copyright",
                ],
                valid: false,
              },
              {
                file: "file-5.ts",
                errors: [
                  "Does not have a license header",
                  "Does not have the expected copyright",
                ],
                valid: false,
              },
            ],
          },
        ],
        files: [
          {
            file: "file-1.ts",
            valid: true,
            result: [{ rule: "Rule 1", errors: [], valid: true }],
          },
          {
            file: "file-2.ts",
            valid: false,
            result: [
              {
                rule: "Rule 1",
                errors: ["Does not have a license header"],
                valid: false,
              },
            ],
          },
          {
            file: "file-3.ts",
            valid: false,
            result: [
              {
                rule: "Rule 1",
                errors: ["Does not have a copyright"],
                valid: false,
              },
            ],
          },
          {
            file: "file-4.ts",
            valid: false,
            result: [
              {
                rule: "Rule 1",
                errors: [
                  "License MIT does not satisfy Apache-2.0",
                  "Does not have a copyright",
                ],
                valid: false,
              },
            ],
          },
          {
            file: "file-5.ts",
            valid: false,
            result: [
              {
                rule: "Rule 1",
                errors: [
                  "Does not have a license header",
                  "Does not have the expected copyright",
                ],
                valid: false,
              },
            ],
          },
        ],
        errors: [
          {
            file: "file-2.ts",
            rule: "Rule 1",
            error: "Does not have a license header",
          },
          {
            file: "file-3.ts",
            rule: "Rule 1",
            error: "Does not have a copyright",
          },
          {
            file: "file-4.ts",
            rule: "Rule 1",
            error: "License MIT does not satisfy Apache-2.0",
          },
          {
            file: "file-4.ts",
            rule: "Rule 1",
            error: "Does not have a copyright",
          },
          {
            file: "file-5.ts",
            rule: "Rule 1",
            error: "Does not have a license header",
          },
          {
            file: "file-5.ts",
            rule: "Rule 1",
            error: "Does not have the expected copyright",
          },
        ],
        checkedFiles: 5,
        validFiles: 1,
        invalidFiles: 4,
      });
    });

    it("should not be valid when detecting any error from multiple rules", async () => {
      const checker = new Checker({
        log: "error",
        rules: [
          {
            name: "Rule 1",
            headers: [
              {
                files: ["folder-1/**/*.ts"],
                license: ["Apache-2.0"],
                copyright: [],
              },
              {
                files: "folder-1/**/*.ts",
                copyright: "\\d{4}(\\s-\\s\\d{4})? Copyright Holder",
                license: [],
              },
            ],
          },
          {
            name: "Rule 2",
            headers: [
              {
                files: "folder-2/**/*.ts",
                copyright: ["\\d{4}(\\s-\\s\\d{4})? Copyright Holder 2"],
                ignore: ["**/subfolder/**"],
              },
            ],
            ignore: "node_modules",
          },
          {
            name: "Rule 3",
            headers: [
              {
                files: "folder-3/**/*.ts",
                license: "MIT",
              },
            ],
          },
          {
            name: "Rule 4",
            headers: [
              {
                files: ["folder-1/**/*.ts"],
                license: ["Apache-2.0"],
                copyright: "\\d{4}(\\s-\\s\\d{4})? Copyright Holder",
              },
            ],
          },
        ],
        ignore: ["folder-3/subfolder/**"],
      });

      jest.mocked(glob).mockImplementation(async (globPatterns) => {
        if (globPatterns[0] === "folder-1/**/*.ts") {
          return [
            "folder-1/file-1.ts",
            "folder-1/file-2.ts",
            "folder-1/file-3.ts",
          ];
        }
        if (globPatterns[0] === "folder-2/**/*.ts") {
          return [
            "folder-2/file-1.ts",
            "folder-2/file-2.ts",
            "folder-2/subfolder/file-3.ts",
          ];
        }
        if (globPatterns[0] === "folder-3/**/*.ts") {
          return [
            "folder-3/file-1.ts",
            "folder-3/file-2.ts",
            "folder-3/subfolder/file-3.ts",
          ];
        }
        return ["folder-4/file-1.ts"];
      });
      jest
        .mocked(readFile)
        .mockImplementation(async (path: PathLike | FileHandle) => {
          if (path === "folder-1/file-1.ts") {
            return `
          // SPDX-License-Identifier: Apache-2.0
          // SPDX-FileCopyrightText: 2024 Copyright Holder
          `;
          }
          if (path === "folder-1/file-2.ts") {
            return `
          // SPDX-License-Identifier: MIT
          // SPDX-FileCopyrightText: 2024 Foo Holder
          `;
          }
          if (path === "folder-1/file-3.ts") {
            return "// SPDX-FileCopyrightText: 2024 Foo Holder";
          }
          if (path === "folder-2/file-1.ts") {
            return `// SPDX-FileCopyrightText: 2024 Copyright Holder 2`;
          }
          if (path === "folder-2/file-2.ts") {
            return `// SPDX-License-Identifier: MIT`;
          }
          if (path === "folder-2/subfolder/file-3.ts") {
            return `// SPDX-FileCopyrightText: 2024 Foo Holder`;
          }
          if (path === "folder-3/file-1.ts") {
            return `// SPDX-License-Identifier: MIT`;
          }
          if (path === "folder-3/file-2.ts") {
            return "// SPDX-License-Identifier: Apache-2.0";
          }
          if (path === "folder-3/subfolder/file-3.ts") {
            return "// SPDX-License-Identifier: Apache-2.0";
          }
          return "// SPDX-License-Identifier: MIT";
        });

      const result = await checker.check();

      expect(result).toEqual({
        valid: false,
        rules: [
          {
            rule: "Rule 4",
            valid: false,
            result: [
              { file: "folder-1/file-1.ts", valid: true, errors: [] },
              {
                file: "folder-1/file-2.ts",
                valid: false,
                errors: [
                  "License MIT does not satisfy Apache-2.0",
                  "Does not have the expected copyright",
                ],
              },
              {
                file: "folder-1/file-3.ts",
                valid: false,
                errors: [
                  "Does not have a license header",
                  "Does not have the expected copyright",
                ],
              },
            ],
          },
          {
            rule: "Rule 3",
            valid: false,
            result: [
              { file: "folder-3/file-1.ts", valid: true, errors: [] },
              {
                file: "folder-3/file-2.ts",
                valid: false,
                errors: ["License Apache-2.0 does not satisfy MIT"],
              },
              {
                file: "folder-3/subfolder/file-3.ts",
                valid: false,
                errors: ["License Apache-2.0 does not satisfy MIT"],
              },
            ],
          },
          {
            rule: "Rule 2",
            valid: false,
            result: [
              { file: "folder-2/file-1.ts", valid: true, errors: [] },
              {
                file: "folder-2/file-2.ts",
                valid: false,
                errors: ["Does not have a copyright"],
              },
              {
                file: "folder-2/subfolder/file-3.ts",
                valid: false,
                errors: ["Does not have the expected copyright"],
              },
            ],
          },
          {
            rule: "Rule 1",
            valid: false,
            result: [
              { file: "folder-1/file-1.ts", valid: true, errors: [] },
              {
                file: "folder-1/file-2.ts",
                valid: false,
                errors: [
                  "License MIT does not satisfy Apache-2.0",
                  "Does not have the expected copyright",
                ],
              },
              {
                file: "folder-1/file-3.ts",
                valid: false,
                errors: [
                  "Does not have a license header",
                  "Does not have the expected copyright",
                ],
              },
            ],
          },
        ],
        files: [
          {
            file: "folder-1/file-1.ts",
            valid: true,
            result: [
              { rule: "Rule 4", errors: [], valid: true },
              { rule: "Rule 1", errors: [], valid: true },
            ],
          },
          {
            file: "folder-1/file-2.ts",
            valid: false,
            result: [
              {
                rule: "Rule 4",
                errors: [
                  "License MIT does not satisfy Apache-2.0",
                  "Does not have the expected copyright",
                ],
                valid: false,
              },
              {
                rule: "Rule 1",
                errors: [
                  "License MIT does not satisfy Apache-2.0",
                  "Does not have the expected copyright",
                ],
                valid: false,
              },
            ],
          },
          {
            file: "folder-1/file-3.ts",
            valid: false,
            result: [
              {
                rule: "Rule 4",
                errors: [
                  "Does not have a license header",
                  "Does not have the expected copyright",
                ],
                valid: false,
              },
              {
                rule: "Rule 1",
                errors: [
                  "Does not have a license header",
                  "Does not have the expected copyright",
                ],
                valid: false,
              },
            ],
          },
          {
            file: "folder-3/file-1.ts",
            valid: true,
            result: [{ rule: "Rule 3", errors: [], valid: true }],
          },
          {
            file: "folder-3/file-2.ts",
            valid: false,
            result: [
              {
                rule: "Rule 3",
                errors: ["License Apache-2.0 does not satisfy MIT"],
                valid: false,
              },
            ],
          },
          {
            file: "folder-3/subfolder/file-3.ts",
            valid: false,
            result: [
              {
                rule: "Rule 3",
                errors: ["License Apache-2.0 does not satisfy MIT"],
                valid: false,
              },
            ],
          },
          {
            file: "folder-2/file-1.ts",
            valid: true,
            result: [{ rule: "Rule 2", errors: [], valid: true }],
          },
          {
            file: "folder-2/file-2.ts",
            valid: false,
            result: [
              {
                rule: "Rule 2",
                errors: ["Does not have a copyright"],
                valid: false,
              },
            ],
          },
          {
            file: "folder-2/subfolder/file-3.ts",
            valid: false,
            result: [
              {
                rule: "Rule 2",
                errors: ["Does not have the expected copyright"],
                valid: false,
              },
            ],
          },
        ],
        errors: [
          {
            file: "folder-1/file-2.ts",
            rule: "Rule 4",
            error: "License MIT does not satisfy Apache-2.0",
          },
          {
            file: "folder-1/file-2.ts",
            rule: "Rule 4",
            error: "Does not have the expected copyright",
          },
          {
            file: "folder-1/file-2.ts",
            rule: "Rule 1",
            error: "License MIT does not satisfy Apache-2.0",
          },
          {
            file: "folder-1/file-2.ts",
            rule: "Rule 1",
            error: "Does not have the expected copyright",
          },
          {
            file: "folder-1/file-3.ts",
            rule: "Rule 4",
            error: "Does not have a license header",
          },
          {
            file: "folder-1/file-3.ts",
            rule: "Rule 4",
            error: "Does not have the expected copyright",
          },
          {
            file: "folder-1/file-3.ts",
            rule: "Rule 1",
            error: "Does not have a license header",
          },
          {
            file: "folder-1/file-3.ts",
            rule: "Rule 1",
            error: "Does not have the expected copyright",
          },
          {
            file: "folder-3/file-2.ts",
            rule: "Rule 3",
            error: "License Apache-2.0 does not satisfy MIT",
          },
          {
            file: "folder-3/subfolder/file-3.ts",
            rule: "Rule 3",
            error: "License Apache-2.0 does not satisfy MIT",
          },
          {
            file: "folder-2/file-2.ts",
            rule: "Rule 2",
            error: "Does not have a copyright",
          },
          {
            file: "folder-2/subfolder/file-3.ts",
            rule: "Rule 2",
            error: "Does not have the expected copyright",
          },
        ],
        checkedFiles: 9,
        validFiles: 3,
        invalidFiles: 6,
      });
    });

    it("should be not valid when there is an error checking license header", async () => {
      const checker = new Checker({
        rules: [
          {
            name: "Rule 1",
            headers: [
              {
                files: "**/*.ts",
                license: ["Apache-2.0"],
                copyright: "\\d{4}(\\s-\\s\\d{4})? Copyright Holder",
              },
            ],
          },
        ],
      });

      jest.mocked(glob).mockResolvedValue(["file-1.ts"]);
      jest
        .mocked(readFile)
        .mockResolvedValue(`// SPDX-License-Identifier: Apache-2.0`);
      jest.mocked(satisfies).mockImplementation(() => {
        throw new Error("Error checking license header");
      });

      const result = await checker.check();

      expect(result).toEqual({
        valid: false,
        rules: [
          {
            rule: "Rule 1",
            valid: false,
            result: [
              {
                file: "file-1.ts",
                errors: [
                  'Error checking license: Error checking license header. Is "Apache-2.0" a valid SPDX id?',
                  "Does not have a copyright",
                ],
                valid: false,
              },
            ],
          },
        ],
        files: [
          {
            file: "file-1.ts",
            valid: false,
            result: [
              {
                rule: "Rule 1",
                errors: [
                  'Error checking license: Error checking license header. Is "Apache-2.0" a valid SPDX id?',
                  "Does not have a copyright",
                ],
                valid: false,
              },
            ],
          },
        ],
        errors: [
          {
            file: "file-1.ts",
            rule: "Rule 1",
            error:
              'Error checking license: Error checking license header. Is "Apache-2.0" a valid SPDX id?',
          },
          {
            file: "file-1.ts",
            rule: "Rule 1",
            error: "Does not have a copyright",
          },
        ],
        checkedFiles: 1,
        validFiles: 0,
        invalidFiles: 1,
      });
    });
  });
});
