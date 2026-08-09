import React from "react";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import TransactionTitle from "../TransactionTitle";
import { TransactionRequestStatus, TransactionResponseItem } from "../../models";

const transaction = (overrides: object = {}) =>
  ({
    id: "transaction-1",
    senderName: "Ada Lovelace",
    receiverName: "Grace Hopper",
    ...overrides,
  }) as TransactionResponseItem;

describe("TransactionTitle", () => {
  test("renders the sender and receiver", () => {
    render(<TransactionTitle transaction={transaction()} />);

    expect(screen.getByTestId("transaction-sender-transaction-1")).toHaveTextContent(
      "Ada Lovelace"
    );
    expect(screen.getByTestId("transaction-receiver-transaction-1")).toHaveTextContent(
      "Grace Hopper"
    );
  });

  test("describes a payment as paid", () => {
    render(<TransactionTitle transaction={transaction()} />);

    expect(screen.getByTestId("transaction-action-transaction-1")).toHaveTextContent("paid");
  });

  test("describes a pending request as requested", () => {
    render(
      <TransactionTitle
        transaction={transaction({ requestStatus: TransactionRequestStatus.pending })}
      />
    );

    expect(screen.getByTestId("transaction-action-transaction-1")).toHaveTextContent("requested");
  });

  test("describes an accepted request as charged", () => {
    render(
      <TransactionTitle
        transaction={transaction({ requestStatus: TransactionRequestStatus.accepted })}
      />
    );

    expect(screen.getByTestId("transaction-action-transaction-1")).toHaveTextContent("charged");
  });
});
