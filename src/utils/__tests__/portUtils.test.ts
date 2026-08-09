import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const detect = vi.fn();

vi.mock("detect-port", () => ({
  default: (port: number) => detect(port),
}));

const importPortUtils = async () => await import("../portUtils");

describe("Port Utils", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    detect.mockReset();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.env.PORT = "3000";
    process.env.VITE_BACKEND_PORT = "3001";
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("exposes the configured frontend and backend ports", async () => {
    const { frontendPort, backendPort } = await importPortUtils();

    expect(frontendPort).toEqual("3000");
    expect(backendPort).toEqual("3001");
  });

  test("returns the configured backend port when it is available", async () => {
    detect.mockResolvedValue(3001);
    const { getBackendPort } = await importPortUtils();

    await expect(getBackendPort()).resolves.toEqual(3001);
    expect(detect).toHaveBeenCalledWith(3001);
  });

  test("returns the fallback port when the configured port is taken", async () => {
    detect.mockResolvedValue(3002);
    const { getBackendPort } = await importPortUtils();

    await expect(getBackendPort()).resolves.toEqual(3002);
    expect(logSpy).toHaveBeenCalled();
  });

  test("logs and resolves undefined when port detection fails", async () => {
    detect.mockRejectedValue(new Error("detection failed"));
    const { getBackendPort } = await importPortUtils();

    await expect(getBackendPort()).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalled();
  });
});
