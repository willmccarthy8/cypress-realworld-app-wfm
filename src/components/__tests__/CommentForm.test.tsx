import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommentForm from "../CommentForm";

describe("CommentForm", () => {
  test("submits the comment along with the transaction id", async () => {
    const transactionComment = vi.fn();
    render(<CommentForm transactionId="transaction-1" transactionComment={transactionComment} />);
    const input = screen.getByTestId("transaction-comment-input-transaction-1");

    fireEvent.change(input, { target: { value: "nice" } });
    fireEvent.submit(input);

    await waitFor(() =>
      expect(transactionComment).toHaveBeenCalledWith({
        transactionId: "transaction-1",
        content: "nice",
      })
    );
  });

  test("starts empty", () => {
    render(<CommentForm transactionId="transaction-1" transactionComment={vi.fn()} />);

    expect(screen.getByTestId("transaction-comment-input-transaction-1")).toHaveValue("");
  });
});
