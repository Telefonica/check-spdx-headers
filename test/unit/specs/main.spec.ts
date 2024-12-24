// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import * as core from "@actions/core";
import * as main from "../../../src/main";

import { Checker } from "../../../src/lib/index";
import { getConfig } from "../../../src/Config";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

jest.mock<typeof import("../../../src/lib/index")>(
  "../../../src/lib/index",
  () => ({
    ...jest.requireActual("../../../src/lib/index"),
    Checker: jest.fn().mockImplementation(),
  }),
);

jest.mock<typeof import("fs/promises")>("fs/promises", () => ({
  ...jest.requireActual("fs/promises"),
  readFile: jest.fn().mockResolvedValue(
    `
rules: []
    `,
  ),
}));

jest.mock<typeof import("fs")>("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn().mockReturnValue(true),
}));

// NOTE: We can't use the strip-indent package in the test environment because it is a module. We should configure Jest to use the ESM module system to use it.
function removeIndentation(str: string) {
  return str
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

describe("action", () => {
  let getInputMock: jest.SpiedFunction<typeof core.getInput>;
  let getMultilineInputMock: jest.SpiedFunction<typeof core.getMultilineInput>;
  let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;
  let setOutputMock: jest.SpiedFunction<typeof core.setOutput>;
  const runMock = jest.spyOn(main, "run");

  beforeEach(() => {
    jest.clearAllMocks();

    getInputMock = jest.spyOn(core, "getInput").mockImplementation(() => "");
    getMultilineInputMock = jest
      .spyOn(core, "getMultilineInput")
      .mockImplementation(() => []);

    setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();
    setOutputMock = jest.spyOn(core, "setOutput").mockImplementation();

    jest.spyOn(core, "debug").mockImplementation();
    jest.spyOn(core, "info").mockImplementation();
    jest.spyOn(core, "error").mockImplementation();
  });

  describe("configuration", () => {
    it("should set failOnError as true by default", async () => {
      const config = await getConfig();

      expect(config.failOnError).toBe(true);
    });

    it("should throw when failOnError has not a boolean value", async () => {
      getInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "failOnError") {
          return "foo";
        }
        return "";
      });

      await expect(() => getConfig()).rejects.toThrow("Invalid boolean value");
    });

    it("should set reporter as text by default", async () => {
      const config = await getConfig();

      expect(config.reporter).toBe("text");
    });

    it("should set reporter from inputs", async () => {
      getInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "reporter") {
          return "json";
        }
        return "";
      });
      const config = await getConfig();

      expect(config.reporter).toBe("json");
    });

    it("should throw when no rules are provided", async () => {
      jest.mocked(readFile).mockResolvedValueOnce("");

      await expect(() => getConfig()).rejects.toThrow(
        'Validation error: Required at "rules"',
      );
    });

    it("should get rules and ignore from inputs when there is no file", async () => {
      jest.mocked(existsSync).mockReturnValueOnce(false);
      getMultilineInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "rules") {
          return [`- name: "Rule 1"`, "  headers: []"];
        }
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "ignore") {
          return ["- file1", "- file2"];
        }
        return [];
      });

      const config = await getConfig();

      expect(config.rules).toEqual([
        {
          name: "Rule 1",
          headers: [],
        },
      ]);

      expect(config.ignore).toEqual(["file1", "file2"]);
    });

    it("should get config from config input", async () => {
      getMultilineInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "config") {
          return ["rules: []", "log: debug", "ignore:", "  - file1"];
        }
        return [];
      });

      const config = await getConfig();

      expect(config.rules).toEqual([]);
      expect(config.log).toBe("debug");
      expect(config.ignore).toEqual(["file1"]);
    });

    it("should merge config from file and inputs", async () => {
      getMultilineInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "config") {
          return ["log: debug", "ignore:", "  - file1"];
        }
        return [];
      });

      jest.mocked(readFile).mockResolvedValueOnce(`
rules: []
reporter: json
      `);

      getInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "log") {
          return "warning";
        }
        return "";
      });

      const config = await getConfig();

      expect(config.rules).toEqual([]);
      expect(config.log).toBe("warning");
      expect(config.ignore).toEqual(["file1"]);
      expect(config.reporter).toBe("json");
    });
  });

  describe("when all checks are valid", () => {
    it("should set as output valid true and the result report", async () => {
      // @ts-expect-error We don't want to mock the whole module
      jest.mocked(Checker).mockImplementation(() => ({
        check: jest.fn().mockReturnValue({
          valid: true,
          checkedFiles: 1,
          validFiles: 1,
          invalidFiles: 0,
          errors: [],
          rules: [
            {
              rule: "Rule 1",
              valid: true,
              result: [
                {
                  file: "file1",
                  valid: true,
                  errors: [],
                },
              ],
            },
          ],
          files: [
            {
              file: "file1",
              valid: true,
              result: [],
            },
          ],
        }),
      }));

      await main.run();

      expect(setOutputMock).toHaveBeenNthCalledWith(
        1,
        "report",
        "Checked 1 file.\nAll files have valid headers.",
      );

      expect(setOutputMock).toHaveBeenNthCalledWith(2, "valid", true);
    });
  });

  describe("when there are no valid headers", () => {
    it("should set as output valid false and the result report", async () => {
      // @ts-expect-error We don't want to mock the whole module
      jest.mocked(Checker).mockImplementation(() => ({
        check: jest.fn().mockReturnValue({
          valid: false,
          checkedFiles: 1,
          validFiles: 0,
          invalidFiles: 1,
          errors: [
            {
              rule: "Rule 1",
              file: "file1",
              error: "Error 1",
            },
          ],
          rules: [
            {
              rule: "Rule 1",
              valid: false,
              result: [
                {
                  file: "file1",
                  valid: false,
                  errors: [
                    {
                      file: "file1",
                      valid: false,
                      errors: ["Error 1"],
                    },
                  ],
                },
              ],
            },
          ],
          files: [
            {
              file: "file1",
              valid: false,
              result: [
                {
                  rule: "Rule 1",
                  valid: false,
                  errors: ["Error 1"],
                },
              ],
            },
          ],
        }),
      }));

      await main.run();

      expect(setOutputMock).toHaveBeenNthCalledWith(
        1,
        "report",
        "Checked 1 file.\nFound 1 error in 1 file:\nFile 'file1': Error 1.",
      );

      expect(setOutputMock).toHaveBeenNthCalledWith(2, "valid", false);
    });

    it("should set the action as failed if failOnError is true", async () => {
      getInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "failOnError") {
          return "true";
        }
        return "";
      });

      // @ts-expect-error We don't want to mock the whole module
      jest.mocked(Checker).mockImplementation(() => ({
        check: jest.fn().mockReturnValue({
          valid: false,
          checkedFiles: 1,
          validFiles: 0,
          invalidFiles: 1,
          errors: [],
          rules: [],
          files: [],
        }),
      }));

      await main.run();

      expect(setFailedMock).toHaveBeenNthCalledWith(
        1,
        "Some files do not have valid SPDX headers",
      );
    });

    it("should not set the action as failed if failOnError option is false", async () => {
      getInputMock.mockImplementation((name: string) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (name === "failOnError") {
          return "false";
        }
        return "";
      });

      // @ts-expect-error We don't want to mock the whole module
      jest.mocked(Checker).mockImplementation(() => ({
        check: jest.fn().mockReturnValue({
          valid: false,
          checkedFiles: 1,
          validFiles: 0,
          invalidFiles: 1,
          errors: [],
          rules: [],
          files: [],
        }),
      }));

      await main.run();

      expect(setFailedMock).not.toHaveBeenCalled();
    });
  });

  describe("reports", () => {
    describe("when there are no errors", () => {
      const MOCK_RESULT = {
        valid: true,
        checkedFiles: 1,
        validFiles: 1,
        invalidFiles: 0,
        errors: [],
        rules: [
          {
            rule: "Rule 1",
            valid: true,
            result: [
              {
                file: "file1",
                valid: true,
                errors: [],
              },
            ],
          },
        ],
        files: [
          {
            file: "file1",
            valid: true,
            result: [],
          },
        ],
      };

      beforeEach(() => {
        // @ts-expect-error We don't want to mock the whole module
        jest.mocked(Checker).mockImplementationOnce(() => ({
          check: jest.fn().mockReturnValue(MOCK_RESULT),
        }));
      });

      describe("when the reporter is text", () => {
        it("should include the number of validated files", async () => {
          await main.run();

          expect(setOutputMock).toHaveBeenNthCalledWith(
            1,
            "report",
            "Checked 1 file.\nAll files have valid headers.",
          );

          expect(setOutputMock).toHaveBeenNthCalledWith(2, "valid", true);
        });
      });

      describe("when the reporter is json", () => {
        it("should include the whole result, adding a summary", async () => {
          getInputMock.mockImplementation((name: string) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (name === "reporter") {
              return "json";
            }
            return "";
          });

          await main.run();

          expect(setOutputMock).toHaveBeenNthCalledWith(
            1,
            "report",
            JSON.stringify({
              message: "Checked 1 file. All files have valid headers.",
              ...MOCK_RESULT,
            }),
          );

          expect(setOutputMock).toHaveBeenNthCalledWith(2, "valid", true);
        });
      });

      describe("when the reporter is markdown", () => {
        it("should include the whole result, adding a summary", async () => {
          getInputMock.mockImplementation((name: string) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (name === "reporter") {
              return "markdown";
            }
            return "";
          });

          await main.run();

          expect(removeIndentation(setOutputMock.mock.calls[0][1])).toEqual(
            removeIndentation(`
              __Check SPDX headers__
              
              ✅ 1 file have valid headers.
            `),
          );
        });
      });
    });

    describe("when there are errors", () => {
      const MOCK_RESULT = {
        valid: false,
        checkedFiles: 3,
        validFiles: 1,
        invalidFiles: 2,
        errors: [
          {
            rule: "Rule 1",
            file: "file1",
            error: "Error A file 1",
          },
          {
            rule: "Rule 2",
            file: "file1",
            error: "Error B file 1",
          },
          {
            rule: "Rule 2",
            file: "file2",
            error: "Error A file 2",
          },
          {
            rule: "Rule 2",
            file: "file2",
            error: "Error B file 2",
          },
        ],
        rules: [
          {
            rule: "Rule 1",
            valid: true,
            result: [
              {
                file: "file1",
                valid: false,
                errors: ["Error A file 1"],
              },
            ],
          },
          {
            rule: "Rule 2",
            valid: true,
            result: [
              {
                file: "file1",
                valid: false,
                errors: ["Error B file 1"],
              },
              {
                file: "file2",
                valid: true,
                errors: ["Error A file 2", "Error B file 2"],
              },
            ],
          },
        ],
        files: [
          {
            file: "file1",
            valid: false,
            result: [
              {
                rule: "Rule 1",
                valid: false,
                errors: ["Error A file 1"],
              },
              {
                rule: "Rule 2",
                valid: false,
                errors: ["Error B file 1"],
              },
            ],
          },
          {
            file: "file2",
            valid: false,
            result: [
              {
                rule: "Rule 2",
                valid: false,
                errors: ["Error A file 2", "Error B file 2"],
              },
            ],
          },
          {
            file: "file3",
            valid: true,
            result: [],
          },
        ],
      };

      beforeEach(() => {
        // @ts-expect-error We don't want to mock the whole module
        jest.mocked(Checker).mockImplementation(() => ({
          check: jest.fn().mockReturnValue(MOCK_RESULT),
        }));
      });

      describe("when the reporter is text", () => {
        it("should detail the errors", async () => {
          await main.run();

          expect(removeIndentation(setOutputMock.mock.calls[0][1])).toEqual(
            removeIndentation(`Checked 3 files.
              Found 4 errors in 2 files:
              File 'file1': Error A file 1. Error B file 1.
              File 'file2': Error A file 2. Error B file 2.`),
          );

          expect(setOutputMock).toHaveBeenNthCalledWith(2, "valid", false);
        });
      });

      describe("when the reporter is json", () => {
        it("should include the whole result, adding a summary", async () => {
          getInputMock.mockImplementation((name: string) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (name === "reporter") {
              return "json";
            }
            return "";
          });

          await main.run();

          expect(setOutputMock).toHaveBeenNthCalledWith(
            1,
            "report",
            JSON.stringify({
              message: `Checked 3 files. Found 4 errors in 2 files`,
              ...MOCK_RESULT,
            }),
          );

          expect(setOutputMock).toHaveBeenNthCalledWith(2, "valid", false);
        });
      });

      describe("when the reporter is markdown", () => {
        beforeEach(() => {
          getInputMock.mockImplementation((name: string) => {
            if (name === "reporter") {
              return "markdown";
            }
            return "";
          });
        });

        it("should include the whole result, adding a summary", async () => {
          await main.run();

          expect(removeIndentation(setOutputMock.mock.calls[0][1])).toEqual(
            removeIndentation(`
              __Check SPDX headers__

              Checked 3 files.
              
              ✅ 1 file have valid headers.
              ❌ Found 4 errors in 2 files:

              - File: file1
                - Rule 1: Error A file 1
                - Rule 2: Error B file 1
              - File: file2
                - Rule 2:
                  - Error A file 2
                  - Error B file 2
            `),
          );
        });

        it("should not mention valid files when there are none", async () => {
          // @ts-expect-error We don't want to mock the whole module
          jest.mocked(Checker).mockImplementation(() => ({
            check: jest.fn().mockReturnValue({
              valid: false,
              checkedFiles: 1,
              validFiles: 0,
              invalidFiles: 1,
              errors: [
                {
                  rule: "Rule 1",
                  file: "file1",
                  error: "Error A file 1",
                },
              ],
              rules: [
                {
                  rule: "Rule 1",
                  valid: true,
                  result: [
                    {
                      file: "file1",
                      valid: false,
                      errors: ["Error A file 1"],
                    },
                  ],
                },
              ],
              files: [
                {
                  file: "file1",
                  valid: false,
                  result: [
                    {
                      rule: "Rule 1",
                      valid: false,
                      errors: ["Error A file 1"],
                    },
                  ],
                },
              ],
            }),
          }));

          await main.run();

          expect(removeIndentation(setOutputMock.mock.calls[0][1])).toEqual(
            removeIndentation(`
              __Check SPDX headers__

              Checked 1 file.
              

              ❌ Found 1 error in 1 file:

              - File: file1
                - Rule 1: Error A file 1
            `),
          );
        });
      });
    });
  });

  describe("when any error occurs", () => {
    it("should set action as failed", async () => {
      jest.mocked(getInputMock).mockImplementation(() => {
        throw new Error("Foo error");
      });
      jest.mocked(getMultilineInputMock).mockImplementation(() => {
        throw new Error("Foo error");
      });

      await main.run();

      expect(runMock).toHaveReturned();

      expect(setFailedMock).toHaveBeenNthCalledWith(1, "Foo error");
    });
  });
});
