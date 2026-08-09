import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import UserListSearchForm from "../UserListSearchForm";

describe("UserListSearchForm", () => {
  test("searches on every keystroke", () => {
    const userListSearch = vi.fn();
    render(<UserListSearchForm userListSearch={userListSearch} />);

    fireEvent.change(screen.getByTestId("user-list-search-input"), { target: { value: "ada" } });

    expect(userListSearch).toHaveBeenCalledWith({ q: "ada" });
  });

  test("clears the previous term when focused", () => {
    render(<UserListSearchForm userListSearch={vi.fn()} />);
    const input = screen.getByTestId("user-list-search-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "ada" } });

    fireEvent.focus(input);

    expect(input.value).toEqual("");
  });
});
