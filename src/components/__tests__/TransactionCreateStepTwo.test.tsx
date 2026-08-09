import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TransactionCreateStepTwo from "../TransactionCreateStepTwo";
import { User } from "../../models";

const sender = { id: "user-1", firstName: "Ada", lastName: "Lovelace" } as User;
const receiver = { id: "user-2", firstName: "Grace", lastName: "Hopper" } as User;

const renderStep = () => {
  const createTransaction = vi.fn();
  const showSnackbar = vi.fn();
  render(
    <TransactionCreateStepTwo
      sender={sender}
      receiver={receiver}
      createTransaction={createTransaction}
      showSnackbar={showSnackbar}
    />
  );
  return { createTransaction, showSnackbar };
};

const fillIn = (amount: string, description: string) => {
  fireEvent.change(screen.getByTestId("transaction-create-amount-input").querySelector("input")!, {
    target: { value: amount },
  });
  fireEvent.change(
    screen.getByTestId("transaction-create-description-input").querySelector("input")!,
    { target: { value: description } }
  );
};

describe("TransactionCreateStepTwo", () => {
  test("names the receiver", () => {
    renderStep();

    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  test("disables both actions until an amount and a note are entered", async () => {
    renderStep();

    await waitFor(() =>
      expect(screen.getByTestId("transaction-create-submit-payment")).toBeDisabled()
    );
    expect(screen.getByTestId("transaction-create-submit-request")).toBeDisabled();

    fillIn("100", "Dinner");

    await waitFor(() =>
      expect(screen.getByTestId("transaction-create-submit-payment")).toBeEnabled()
    );
  });

  test("creates a payment and confirms it with a snackbar", async () => {
    const { createTransaction, showSnackbar } = renderStep();
    fillIn("100", "Dinner");
    await waitFor(() =>
      expect(screen.getByTestId("transaction-create-submit-payment")).toBeEnabled()
    );

    fireEvent.click(screen.getByTestId("transaction-create-submit-payment"));

    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith({
        transactionType: "payment",
        amount: "100",
        description: "Dinner",
        senderId: "user-1",
        receiverId: "user-2",
      })
    );
    expect(showSnackbar).toHaveBeenCalledWith({
      severity: "success",
      message: "Transaction Submitted!",
    });
  });

  test("creates a request", async () => {
    const { createTransaction } = renderStep();
    fillIn("50", "Coffee");
    await waitFor(() =>
      expect(screen.getByTestId("transaction-create-submit-request")).toBeEnabled()
    );

    fireEvent.click(screen.getByTestId("transaction-create-submit-request"));

    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ transactionType: "request", amount: "50", description: "Coffee" })
      )
    );
  });
});
