import React from "react";
import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import TransactionItem from "../TransactionItem";
import { TransactionResponseItem } from "../../models";

const transaction = {
  id: "transaction-1",
  amount: 100_00,
  description: "Dinner",
  senderName: "Ada Lovelace",
  receiverName: "Grace Hopper",
  likes: [{ id: "like-1" }, { id: "like-2" }],
  comments: [{ id: "comment-1" }],
} as unknown as TransactionResponseItem;

const renderItem = (history = createMemoryHistory()) => {
  render(
    <Router history={history}>
      <TransactionItem transaction={transaction} />
    </Router>
  );
  return history;
};

describe("TransactionItem", () => {
  test("renders the transaction summary with like and comment counts", () => {
    renderItem();

    expect(screen.getByTestId("transaction-item-transaction-1")).toHaveTextContent("Dinner");
    expect(screen.getByTestId("transaction-like-count")).toHaveTextContent("2");
    expect(screen.getByTestId("transaction-comment-count")).toHaveTextContent("1");
    expect(screen.getByTestId("transaction-amount-transaction-1")).toHaveTextContent("-$100.00");
  });

  test("navigates to the transaction detail when clicked", () => {
    const history = renderItem();

    fireEvent.click(screen.getByTestId("transaction-item-transaction-1"));

    expect(history.location.pathname).toEqual("/transaction/transaction-1");
  });
});
