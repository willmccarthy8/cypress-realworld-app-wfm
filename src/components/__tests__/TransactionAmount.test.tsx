import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import TransactionAmount from "../TransactionAmount";
import { TransactionRequestStatus, TransactionResponseItem } from "../../models";

const transaction = (overrides: object = {}) =>
  ({
    id: "transaction-1",
    amount: 150_000,
    senderName: "Ada Lovelace",
    receiverName: "Grace Hopper",
    ...overrides,
  }) as TransactionResponseItem;

describe("TransactionAmount", () => {
  test("renders a payment as a negative amount", () => {
    render(<TransactionAmount transaction={transaction()} />);

    expect(screen.getByTestId("transaction-amount-transaction-1")).toHaveTextContent("-$1,500.00");
  });

  test("renders a request as a positive amount", () => {
    render(
      <TransactionAmount
        transaction={transaction({ requestStatus: TransactionRequestStatus.pending })}
      />
    );

    expect(screen.getByTestId("transaction-amount-transaction-1")).toHaveTextContent("+$1,500.00");
  });

  test("omits the formatted value when there is no amount", () => {
    render(<TransactionAmount transaction={transaction({ amount: 0 })} />);

    expect(screen.getByTestId("transaction-amount-transaction-1")).toHaveTextContent("-");
  });
});
