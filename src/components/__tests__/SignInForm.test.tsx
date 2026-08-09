import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { interpret } from "xstate";
import SignInForm from "../SignInForm";
import { authMachine } from "../../machines/authMachine";

const startService = (context: object = {}) => {
  const performLogin = vi.fn().mockResolvedValue({ user: { id: "user-1" } });
  const service = interpret(
    authMachine.withContext(context as any).withConfig({ services: { performLogin } })
  ).start();
  return { service, performLogin };
};

let started: ReturnType<typeof startService>;

const renderForm = (context: object = {}) => {
  started = startService(context);
  render(
    <MemoryRouter>
      <SignInForm authService={started.service as any} />
    </MemoryRouter>
  );
};

afterEach(() => started?.service.stop());

describe("SignInForm", () => {
  test("sends the credentials to the auth machine", async () => {
    renderForm();

    fireEvent.change(screen.getByTestId("signin-username").querySelector("input")!, {
      target: { value: "ada" },
    });
    fireEvent.change(screen.getByTestId("signin-password").querySelector("input")!, {
      target: { value: "s3cret" },
    });
    fireEvent.click(screen.getByTestId("signin-submit"));

    await waitFor(() => expect(started.performLogin).toHaveBeenCalled());
    expect(started.performLogin.mock.calls[0][1]).toMatchObject({
      type: "LOGIN",
      username: "ada",
      password: "s3cret",
    });
  });

  test("reports a password that is too short", async () => {
    renderForm();

    const password = screen.getByTestId("signin-password").querySelector("input")!;
    fireEvent.change(password, { target: { value: "ab" } });
    fireEvent.blur(password);

    expect(await screen.findByText("Password must contain at least 4 characters")).toBeVisible();
    expect(started.performLogin).not.toHaveBeenCalled();
  });

  test("surfaces the auth machine's error message", () => {
    renderForm({ message: "Username or password is invalid" });

    expect(screen.getByTestId("signin-error")).toHaveTextContent("Username or password is invalid");
  });

  test("does not show an error without a message", () => {
    renderForm();

    expect(screen.queryByTestId("signin-error")).not.toBeInTheDocument();
  });
});
