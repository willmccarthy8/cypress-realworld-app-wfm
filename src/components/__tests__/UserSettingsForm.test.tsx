import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserSettingsForm from "../UserSettingsForm";
import { DefaultPrivacyLevel, User } from "../../models";

const userProfile = {
  id: "user-1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phoneNumber: "555-555-5555",
  defaultPrivacyLevel: DefaultPrivacyLevel.public,
} as User;

const input = (field: string) => screen.getByTestId(`user-settings-${field}-input`);

describe("UserSettingsForm", () => {
  test("prefills the form with the current profile", () => {
    render(<UserSettingsForm userProfile={userProfile} updateUser={vi.fn()} />);

    expect(input("firstName")).toHaveValue("Ada");
    expect(input("lastName")).toHaveValue("Lovelace");
    expect(input("email")).toHaveValue("ada@example.com");
    expect(input("phoneNumber")).toHaveValue("555-555-5555");
  });

  test("submits the edited profile with the user id", async () => {
    const updateUser = vi.fn();
    render(<UserSettingsForm userProfile={userProfile} updateUser={updateUser} />);

    fireEvent.change(input("firstName"), { target: { value: "Grace" } });
    fireEvent.submit(screen.getByTestId("user-settings-form"));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({
        id: "user-1",
        firstName: "Grace",
        lastName: "Lovelace",
        email: "ada@example.com",
        phoneNumber: "555-555-5555",
        defaultPrivacyLevel: DefaultPrivacyLevel.public,
      })
    );
  });

  test("rejects an invalid email address", async () => {
    const updateUser = vi.fn();
    render(<UserSettingsForm userProfile={userProfile} updateUser={updateUser} />);

    fireEvent.change(input("email"), { target: { value: "not-an-email" } });
    fireEvent.submit(screen.getByTestId("user-settings-form"));

    expect(await screen.findByText("Must contain a valid email address")).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  test("requires a first name", async () => {
    const updateUser = vi.fn();
    render(<UserSettingsForm userProfile={userProfile} updateUser={updateUser} />);

    fireEvent.change(input("firstName"), { target: { value: "" } });
    fireEvent.submit(screen.getByTestId("user-settings-form"));

    expect(await screen.findByText("Enter a first name")).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });
});
