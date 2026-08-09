import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { interpret } from "xstate";
import UserSettingsContainer from "../UserSettingsContainer";
import { authMachine } from "../../machines/authMachine";
import { DefaultPrivacyLevel, User } from "../../models";

const currentUser = {
  id: "user-1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phoneNumber: "555-555-5555",
  defaultPrivacyLevel: DefaultPrivacyLevel.public,
} as User;

const startService = (user?: User) => {
  const updateProfile = vi.fn().mockResolvedValue({ user });
  const service = interpret(
    authMachine
      .withContext({ user } as any)
      .withConfig({ services: { updateProfile, getUserProfile: vi.fn() } })
  ).start("authorized");
  return { service, updateProfile };
};

let started: ReturnType<typeof startService>;

const renderContainer = (user?: User) => {
  started = startService(user);
  render(<UserSettingsContainer authService={started.service as any} />);
};

afterEach(() => started?.service.stop());

describe("UserSettingsContainer", () => {
  test("renders the settings form for the current user", () => {
    renderContainer(currentUser);

    expect(screen.getByTestId("user-settings-form")).toBeInTheDocument();
    expect(screen.getByTestId("user-settings-firstName-input")).toHaveValue("Ada");
  });

  test("omits the form until the current user is known", () => {
    renderContainer(undefined);

    expect(screen.queryByTestId("user-settings-form")).not.toBeInTheDocument();
    expect(screen.getByText("User Settings")).toBeInTheDocument();
  });

  test("sends the edited profile to the auth machine", async () => {
    renderContainer(currentUser);

    fireEvent.change(screen.getByTestId("user-settings-lastName-input"), {
      target: { value: "Hopper" },
    });
    fireEvent.submit(screen.getByTestId("user-settings-form"));

    await waitFor(() => expect(started.updateProfile).toHaveBeenCalled());
    expect(started.updateProfile.mock.calls[0][1]).toMatchObject({
      type: "UPDATE",
      id: "user-1",
      lastName: "Hopper",
    });
  });
});
