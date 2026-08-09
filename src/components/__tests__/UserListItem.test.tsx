import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import UserListItem from "../UserListItem";
import { User } from "../../models";

const user = {
  id: "user-1",
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  email: "ada@example.com",
  phoneNumber: "555-555-5555",
  avatar: "https://example.com/avatar.png",
} as User;

describe("UserListItem", () => {
  test("renders the user's name and contact details", () => {
    render(<UserListItem user={user} setReceiver={vi.fn()} index={0} />);

    const item = screen.getByTestId("user-list-item-user-1");

    expect(item).toHaveTextContent("Ada Lovelace");
    expect(item).toHaveTextContent("ada");
    expect(item).toHaveTextContent("ada@example.com");
    expect(item).toHaveTextContent("555-555-5555");
  });

  test("selects the user as the receiver when clicked", () => {
    const setReceiver = vi.fn();
    render(<UserListItem user={user} setReceiver={setReceiver} index={0} />);

    fireEvent.click(screen.getByTestId("user-list-item-user-1"));

    expect(setReceiver).toHaveBeenCalledWith(user);
  });
});
