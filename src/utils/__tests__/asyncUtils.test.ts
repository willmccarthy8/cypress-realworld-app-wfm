import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const importHttpClient = async () => {
  const { httpClient } = await import("../asyncUtils");
  return httpClient;
};

const runRequestInterceptors = async (httpClient: any, config: any) => {
  let result = config;
  const handlers = httpClient.interceptors.request.handlers.filter(Boolean);
  for (const handler of handlers) {
    result = await handler.fulfilled(result);
  }
  return result;
};

describe("Async Utils", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    delete process.env.VITE_AUTH0;
    delete process.env.VITE_OKTA;
    delete process.env.VITE_AWS_COGNITO;
    delete process.env.VITE_GOOGLE;
    delete process.env.VITE_AUTH_TOKEN_NAME;
  });

  test("creates a client that sends credentials", async () => {
    const httpClient = await importHttpClient();

    expect(httpClient.defaults.withCredentials).toBe(true);
  });

  test("registers a request interceptor", async () => {
    const httpClient = await importHttpClient();

    expect(httpClient.interceptors.request.handlers.filter(Boolean).length).toBeGreaterThan(0);
  });

  test("leaves headers untouched when no third-party auth provider is configured", async () => {
    const httpClient = await importHttpClient();

    const config = await runRequestInterceptors(httpClient, { headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  test("attaches a bearer token from localStorage when a provider is configured", async () => {
    process.env.VITE_AUTH0 = "true";
    process.env.VITE_AUTH_TOKEN_NAME = "authAccessToken";
    localStorage.setItem("authAccessToken", "token-123");

    const httpClient = await importHttpClient();
    const config = await runRequestInterceptors(httpClient, { headers: {} });

    expect(config.headers.Authorization).toEqual("Bearer token-123");
  });
});
