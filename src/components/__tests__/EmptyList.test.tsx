import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyList from "../EmptyList";

describe("EmptyList", () => {
  test("names the missing entity", () => {
    render(<EmptyList entity="Bank Accounts" />);

    expect(screen.getByTestId("empty-list-header")).toHaveTextContent("No Bank Accounts");
  });

  test("renders its children as a call to action", () => {
    render(
      <EmptyList entity="Notifications">
        <span>Create a transaction</span>
      </EmptyList>
    );

    expect(screen.getByTestId("empty-list-children")).toHaveTextContent("Create a transaction");
  });
});
