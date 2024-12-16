import * as core from "@actions/core";
import * as main from "../../../src/main";

describe("action", () => {
  let getInputMock: jest.SpiedFunction<typeof core.getInput>;
  let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;
  let consoleLogMock: jest.SpiedFunction<typeof console.log>;
  const runMock = jest.spyOn(main, "run");

  beforeEach(() => {
    jest.clearAllMocks();

    getInputMock = jest.spyOn(core, "getInput").mockImplementation(() => "");

    setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();

    consoleLogMock = jest.spyOn(console, "log").mockImplementation();
  });

  describe("options", () => {
    it("should log option as undefined when no provided", async () => {
      await main.run();

      expect(runMock).toHaveReturned();

      expect(consoleLogMock).toHaveBeenNthCalledWith(1, {
        log: undefined,
      });
    });

    it("should log option value when provided", async () => {
      getInputMock.mockReturnValueOnce("info");
      await main.run();

      expect(runMock).toHaveReturned();

      expect(consoleLogMock).toHaveBeenNthCalledWith(1, {
        log: "info",
      });
    });
  });

  describe("when any error occurs", () => {
    it("should set action as failed", async () => {
      jest.mocked(getInputMock).mockImplementation(() => {
        throw new Error("Foo error");
      });

      await main.run();

      expect(runMock).toHaveReturned();

      expect(setFailedMock).toHaveBeenNthCalledWith(1, "Foo error");
    });
  });
});
