import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BankAccountItem from "../BankAccountItem";
import { BankAccount } from "../../models";

const bankAccount = (overrides: object = {}) =>
  ({
    id: "bank-1",
    bankName: "The Best Bank",
    accountNumber: "123456789",
    routingNumber: "987654321",
    isDeleted: false,
    ...overrides,
  }) as BankAccount;

describe("BankAccountItem", () => {
  test("renders the bank name with a delete action", () => {
    render(<BankAccountItem bankAccount={bankAccount()} deleteBankAccount={vi.fn()} />);

    expect(screen.getByTestId("bankaccount-list-item-bank-1")).toHaveTextContent("The Best Bank");
    expect(screen.getByTestId("bankaccount-delete")).toBeInTheDocument();
  });

  test("deletes the account by id", () => {
    const deleteBankAccount = vi.fn();
    render(<BankAccountItem bankAccount={bankAccount()} deleteBankAccount={deleteBankAccount} />);

    fireEvent.click(screen.getByTestId("bankaccount-delete"));

    expect(deleteBankAccount).toHaveBeenCalledWith({ id: "bank-1" });
  });

  test("marks a deleted account and hides the delete action", () => {
    render(
      <BankAccountItem bankAccount={bankAccount({ isDeleted: true })} deleteBankAccount={vi.fn()} />
    );

    expect(screen.getByTestId("bankaccount-list-item-bank-1")).toHaveTextContent("(Deleted)");
    expect(screen.queryByTestId("bankaccount-delete")).not.toBeInTheDocument();
  });
});
