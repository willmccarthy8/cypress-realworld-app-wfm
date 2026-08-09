import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Route, Router } from "react-router-dom";
import { createMemoryHistory, MemoryHistory } from "history";
import { interpret } from "xstate";
import BankAccountsContainer from "../BankAccountsContainer";
import { authMachine } from "../../machines/authMachine";
import { dataMachine } from "../../machines/dataMachine";
import { BankAccount, User } from "../../models";

const currentUser = { id: "user-1", firstName: "Ada", lastName: "Lovelace" } as User;

const bankAccounts = [{ id: "bank-1", bankName: "The Best Bank" }] as BankAccount[];

const startServices = (accounts: BankAccount[] = bankAccounts) => {
  const fetchData = vi.fn().mockResolvedValue({ results: accounts });
  const createData = vi.fn().mockResolvedValue({ results: accounts });
  const deleteData = vi.fn().mockResolvedValue({ results: [] });
  const authService = interpret(authMachine.withContext({ user: currentUser } as any)).start(
    "authorized"
  );
  const bankAccountsService = interpret(
    dataMachine("bankAccounts").withConfig({
      services: { fetchData, createData, deleteData, updateData: vi.fn() },
    })
  ).start();
  return { authService, bankAccountsService, fetchData, createData, deleteData };
};

let services: ReturnType<typeof startServices>;

const renderContainer = (path: string, started = startServices()) => {
  services = started;
  const history: MemoryHistory = createMemoryHistory({ initialEntries: [path] });
  render(
    <Router history={history}>
      <Route path={["/bankaccounts/new", "/bankaccounts"]}>
        <BankAccountsContainer
          authService={services.authService as any}
          bankAccountsService={services.bankAccountsService as any}
        />
      </Route>
    </Router>
  );
  return history;
};

afterEach(() => {
  services?.authService.stop();
  services?.bankAccountsService.stop();
});

describe("BankAccountsContainer", () => {
  test("fetches and lists the bank accounts", async () => {
    renderContainer("/bankaccounts");

    expect(services.fetchData).toHaveBeenCalled();
    expect(await screen.findByTestId("bankaccount-list-item-bank-1")).toHaveTextContent(
      "The Best Bank"
    );
  });

  test("renders an empty list when the user has no accounts", async () => {
    renderContainer("/bankaccounts", startServices([]));

    await waitFor(() =>
      expect(screen.getByTestId("empty-list-header")).toHaveTextContent("No Bank Accounts")
    );
  });

  test("renders the create form on the new account route", async () => {
    renderContainer("/bankaccounts/new");

    expect(screen.getByText("Create Bank Account")).toBeInTheDocument();
    expect(screen.getByTestId("bankaccount-form")).toBeInTheDocument();
    expect(screen.queryByTestId("bankaccount-list")).not.toBeInTheDocument();
  });
});
