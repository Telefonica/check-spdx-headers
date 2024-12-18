// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import * as core from "@actions/core";
import * as main from "../../../src/main";

// import { Checker } from "../../../src/lib/index";

jest.mock<typeof import("../../../src/lib/index")>(
  "../../../src/lib/index",
  () => ({
    ...jest.requireActual("../../../src/lib/index"),
    Checker: jest.fn().mockImplementation(),
  }),
);

describe("action", () => {
  let getInputMock: jest.SpiedFunction<typeof core.getInput>;
  let getMultilineInputMock: jest.SpiedFunction<typeof core.getMultilineInput>;
  let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;
  const runMock = jest.spyOn(main, "run");

  beforeEach(() => {
    jest.clearAllMocks();

    getInputMock = jest.spyOn(core, "getInput").mockImplementation(() => "");
    getMultilineInputMock = jest
      .spyOn(core, "getMultilineInput")
      .mockImplementation(() => []);

    setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();

    jest.spyOn(core, "debug").mockImplementation();
    jest.spyOn(core, "info").mockImplementation();
    jest.spyOn(core, "error").mockImplementation();
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
