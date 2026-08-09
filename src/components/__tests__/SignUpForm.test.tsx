import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { interpret } from "xstate";
import SignUpForm from "../SignUpForm";
import { authMachine } from "../../machines/authMachine";

const startService = () => {
  const performSignup = vi.fn().mockResolvedValue({});
  const service = interpret(
    authMachine.withContext({} as any).withConfig({ services: { performSignup } })
  ).start();
  return { service, performSignup };
};

let started: ReturnType<typeof startService>;

const renderForm = () => {
  started = startService();
  render(
    <MemoryRouter>
      <SignUpForm authService={started.service as any} />
    </MemoryRouter>
  );
};

const fillIn = (values: Record<string, string>) =>
  Object.entries(values).forEach(([field, value]) =>
    fireEvent.change(screen.getByTestId(`signup-${field}`).querySelector("input")!, {
      target: { value },
    })
  );

afterEach(() => started?.service.stop());

describe("SignUpForm", () => {
  test("signs the new user up through the auth machine", async () => {
    renderForm();

    fillIn({
      "first-name": "Ada",
      "last-name": "Lovelace",
      username: "ada",
      password: "s3cret",
      confirmPassword: "s3cret",
    });
    await waitFor(() => expect(screen.getByTestId("signup-submit")).toBeEnabled());
    fireEvent.click(screen.getByTestId("signup-submit"));

    await waitFor(() => expect(started.performSignup).toHaveBeenCalled());
    expect(started.performSignup.mock.calls[0][1]).toMatchObject({
      type: "SIGNUP",
      firstName: "Ada",
      lastName: "Lovelace",
      username: "ada",
      password: "s3cret",
    });
  });

  test("requires the confirmation to match the password", async () => {
    renderForm();

    fillIn({
      "first-name": "Ada",
      "last-name": "Lovelace",
      username: "ada",
      password: "s3cret",
      confirmPassword: "different",
    });

    expect(await screen.findByText("Password does not match")).toBeVisible();
    await waitFor(() => expect(screen.getByTestId("signup-submit")).toBeDisabled());
    expect(started.performSignup).not.toHaveBeenCalled();
  });
});
