import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import BankAccountForm from "../BankAccountForm";

const validAccount = {
  bankName: "The Best Bank",
  routingNumber: "987654321",
  accountNumber: "123456789",
};

const renderForm = (props: { createBankAccount: Function; onboarding?: boolean }) => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <BankAccountForm userId="user-1" {...props} />
    </Router>
  );
  return history;
};

const fillIn = (values: Record<string, string>) =>
  Object.entries(values).forEach(([field, value]) =>
    fireEvent.change(screen.getByTestId(`bankaccount-${field}-input`).querySelector("input")!, {
      target: { value },
    })
  );

describe("BankAccountForm", () => {
  test("disables the submit button while a field is incomplete", async () => {
    renderForm({ createBankAccount: vi.fn() });

    fillIn({ bankName: "The" });
    await waitFor(() => expect(screen.getByTestId("bankaccount-submit")).toBeDisabled());

    fillIn(validAccount);

    await waitFor(() => expect(screen.getByTestId("bankaccount-submit")).toBeEnabled());
  });

  test("reports an invalid routing number", async () => {
    renderForm({ createBankAccount: vi.fn() });

    fillIn({ ...validAccount, routingNumber: "12345" });

    expect(await screen.findByText("Must contain a valid routing number")).toBeInTheDocument();
    expect(screen.getByTestId("bankaccount-submit")).toBeDisabled();
  });

  test("creates the account for the user and navigates to the account list", async () => {
    const createBankAccount = vi.fn();
    const history = renderForm({ createBankAccount });
    fillIn(validAccount);
    await waitFor(() => expect(screen.getByTestId("bankaccount-submit")).toBeEnabled());

    fireEvent.click(screen.getByTestId("bankaccount-submit"));

    await waitFor(() =>
      expect(createBankAccount).toHaveBeenCalledWith({ ...validAccount, userId: "user-1" })
    );
    expect(history.location.pathname).toEqual("/bankaccounts");
  });

  test("stays in place while onboarding", async () => {
    const history = renderForm({ createBankAccount: vi.fn(), onboarding: true });
    fillIn(validAccount);
    await waitFor(() => expect(screen.getByTestId("bankaccount-submit")).toBeEnabled());

    fireEvent.click(screen.getByTestId("bankaccount-submit"));

    await waitFor(() => expect(history.location.pathname).toEqual("/"));
  });
});
