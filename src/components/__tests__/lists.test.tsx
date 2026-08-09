import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BankAccountList from "../BankAccountList";
import CommentList from "../CommentList";
import NotificationList from "../NotificationList";
import SkeletonList from "../SkeletonList";
import { BankAccount, Comment, NotificationResponseItem } from "../../models";

describe("BankAccountList", () => {
  const bankAccounts = [
    { id: "bank-1", bankName: "The Best Bank" },
    { id: "bank-2", bankName: "The Other Bank" },
  ] as BankAccount[];

  test("renders an item per bank account", () => {
    render(<BankAccountList bankAccounts={bankAccounts} deleteBankAccount={vi.fn()} />);

    expect(screen.getByTestId("bankaccount-list")).toBeInTheDocument();
    expect(screen.getByTestId("bankaccount-list-item-bank-1")).toBeInTheDocument();
    expect(screen.getByTestId("bankaccount-list-item-bank-2")).toBeInTheDocument();
  });

  test("falls back to an empty list", () => {
    render(<BankAccountList bankAccounts={[]} deleteBankAccount={vi.fn()} />);

    expect(screen.queryByTestId("bankaccount-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-list-header")).toHaveTextContent("No Bank Accounts");
  });
});

describe("CommentList", () => {
  test("renders an item per comment", () => {
    const comments = [
      { id: "comment-1", content: "nice" },
      { id: "comment-2", content: "thanks" },
    ] as Comment[];

    render(<CommentList comments={comments} />);

    expect(screen.getByTestId("comment-list-item-comment-1")).toHaveTextContent("nice");
    expect(screen.getByTestId("comment-list-item-comment-2")).toHaveTextContent("thanks");
  });

  test("renders an empty list without comments", () => {
    render(<CommentList comments={undefined as unknown as Comment[]} />);

    expect(screen.getByTestId("comments-list")).toBeEmptyDOMElement();
  });
});

describe("NotificationList", () => {
  test("renders an item per notification", () => {
    const notifications = [
      { id: "notification-1", userFullName: "Ada Lovelace", likeId: "like-1" },
    ] as unknown as NotificationResponseItem[];

    render(<NotificationList notifications={notifications} updateNotification={vi.fn()} />);

    expect(screen.getByTestId("notifications-list")).toBeInTheDocument();
    expect(screen.getByTestId("notification-list-item-notification-1")).toBeInTheDocument();
  });

  test("falls back to an empty list", () => {
    render(<NotificationList notifications={[]} updateNotification={vi.fn()} />);

    expect(screen.queryByTestId("notifications-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-list-header")).toHaveTextContent("No Notifications");
  });
});

describe("SkeletonList", () => {
  test("renders a loading placeholder", () => {
    render(<SkeletonList />);

    expect(screen.getByTestId("list-skeleton")).toBeInTheDocument();
  });
});
