import { beforeEach, describe, expect, test, vi } from "vitest";
import { interpret } from "xstate";

const httpClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
};

vi.mock("../../utils/asyncUtils", () => ({ httpClient }));

const importAuthMachine = async () => {
  const { authMachine } = await import("../authMachine");
  return authMachine;
};

const user = { id: "user-1", firstName: "Ada" };

const startWith = (machine: any, services: object) =>
  interpret(machine.withConfig({ services })).start();

describe("authMachine", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    httpClient.get.mockReset();
    httpClient.post.mockReset();
    httpClient.patch.mockReset();
  });

  test("starts unauthorized without a user", async () => {
    const authMachine = await importAuthMachine();

    expect(authMachine.initialState.matches("unauthorized")).toBe(true);
    expect(authMachine.initialState.context.user).toBeUndefined();
  });

  test("routes each unauthorized event to its provider state", async () => {
    const authMachine = await importAuthMachine();

    const targets: Record<string, string> = {
      LOGIN: "loading",
      SIGNUP: "signup",
      GOOGLE: "google",
      AUTH0: "auth0",
      OKTA: "okta",
      COGNITO: "cognito",
    };

    for (const [event, target] of Object.entries(targets)) {
      expect(authMachine.transition("unauthorized", event as any).matches(target)).toBe(true);
    }
  });

  test("authorizes the user after a successful login", async () => {
    const authMachine = await importAuthMachine();
    const service = startWith(authMachine, {
      performLogin: vi.fn().mockResolvedValue({ user }),
    });

    service.send({ type: "LOGIN", username: "ada", password: "s3cret" } as any);
    await vi.waitFor(() => expect(service.getSnapshot().matches("authorized")).toBe(true));

    expect(service.getSnapshot().context.user).toEqual(user);
    service.stop();
  });

  test("stays unauthorized and records the message when login fails", async () => {
    const authMachine = await importAuthMachine();
    const service = startWith(authMachine, {
      performLogin: vi.fn().mockRejectedValue(new Error("Username or password is invalid")),
    });

    service.send({ type: "LOGIN", username: "ada", password: "nope" } as any);
    await vi.waitFor(() =>
      expect(service.getSnapshot().context.message).toEqual("Username or password is invalid")
    );

    expect(service.getSnapshot().matches("unauthorized")).toBe(true);
    service.stop();
  });

  test("returns to unauthorized after signing up", async () => {
    const authMachine = await importAuthMachine();
    const performSignup = vi.fn().mockResolvedValue({});
    const service = startWith(authMachine, { performSignup });

    service.send({ type: "SIGNUP", username: "ada" } as any);
    await vi.waitFor(() => expect(performSignup).toHaveBeenCalled());

    expect(service.getSnapshot().matches("unauthorized")).toBe(true);
    service.stop();
  });

  test("refreshes the profile after an update", async () => {
    const authMachine = await importAuthMachine();
    const updateProfile = vi.fn().mockResolvedValue({});
    const service = startWith(authMachine, {
      performLogin: vi.fn().mockResolvedValue({ user }),
      updateProfile,
      getUserProfile: vi.fn().mockResolvedValue({ user: { ...user, firstName: "Grace" } }),
    });

    service.send({ type: "LOGIN" } as any);
    await vi.waitFor(() => expect(service.getSnapshot().matches("authorized")).toBe(true));

    service.send({ type: "UPDATE", id: "user-1", firstName: "Grace" } as any);
    await vi.waitFor(() =>
      expect(service.getSnapshot().context.user).toEqual({ ...user, firstName: "Grace" })
    );

    expect(updateProfile).toHaveBeenCalled();
    expect(service.getSnapshot().matches("authorized")).toBe(true);
    service.stop();
  });

  test("clears the user on logout", async () => {
    const authMachine = await importAuthMachine();
    const performLogout = vi.fn().mockResolvedValue({});
    const service = startWith(authMachine, {
      performLogin: vi.fn().mockResolvedValue({ user }),
      performLogout,
    });

    service.send({ type: "LOGIN" } as any);
    await vi.waitFor(() => expect(service.getSnapshot().matches("authorized")).toBe(true));

    service.send("LOGOUT");
    await vi.waitFor(() => expect(service.getSnapshot().matches("unauthorized")).toBe(true));

    expect(performLogout).toHaveBeenCalled();
    expect(service.getSnapshot().context.user).toBeUndefined();
    service.stop();
  });

  test("allows logging out while refreshing", async () => {
    const authMachine = await importAuthMachine();

    expect(authMachine.transition("refreshing", "LOGOUT").matches("logout")).toBe(true);
    expect(authMachine.transition("auth0", "LOGOUT").matches("logout")).toBe(true);
    expect(authMachine.transition("okta", "LOGOUT").matches("logout")).toBe(true);
    expect(authMachine.transition("cognito", "LOGOUT").matches("logout")).toBe(true);
    expect(authMachine.transition("google", "LOGOUT").matches("logout")).toBe(true);
  });

  test("posts signup data and redirects to sign in", async () => {
    const authMachine = await importAuthMachine();
    httpClient.post.mockResolvedValue({ data: { user } });

    const result = await authMachine.options.services!.performSignup(
      {},
      { type: "SIGNUP", username: "ada" } as any,
      {} as any
    );

    expect(httpClient.post).toHaveBeenCalledWith(expect.stringContaining("/users"), {
      username: "ada",
    });
    expect(result).toEqual({ user });
  });

  test("requests the current user profile", async () => {
    const authMachine = await importAuthMachine();
    httpClient.get.mockResolvedValue({ data: { user } });

    const result = await authMachine.options.services!.getUserProfile(
      {},
      { type: "REFRESH" } as any,
      {} as any
    );

    expect(httpClient.get).toHaveBeenCalledWith(expect.stringContaining("/checkAuth"));
    expect(result).toEqual({ user });
  });

  test("patches the profile on update", async () => {
    const authMachine = await importAuthMachine();
    httpClient.patch.mockResolvedValue({ data: {} });

    await authMachine.options.services!.updateProfile(
      {},
      { type: "UPDATE", id: "user-1", firstName: "Grace" } as any,
      {} as any
    );

    expect(httpClient.patch).toHaveBeenCalledWith(expect.stringContaining("/users/user-1"), {
      id: "user-1",
      firstName: "Grace",
    });
  });

  test("clears stored auth state on logout", async () => {
    const authMachine = await importAuthMachine();
    localStorage.setItem("authState", JSON.stringify({ value: "authorized" }));
    httpClient.post.mockResolvedValue({ data: {} });

    await authMachine.options.services!.performLogout({}, { type: "LOGOUT" } as any, {} as any);

    expect(localStorage.getItem("authState")).toBeNull();
    expect(httpClient.post).toHaveBeenCalledWith(expect.stringContaining("/logout"));
  });

  test("wraps login errors with a friendly message", async () => {
    const authMachine = await importAuthMachine();
    httpClient.post.mockRejectedValue(new Error("Request failed with status code 401"));

    await expect(
      authMachine.options.services!.performLogin({}, { type: "LOGIN" } as any, {} as any)
    ).rejects.toThrow("Username or password is invalid");
  });
});
