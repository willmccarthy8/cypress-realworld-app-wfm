import React from "react";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationListItem from "../NotificationListItem";
import { NotificationResponseItem, PaymentNotificationStatus } from "../../models";

const notification = (overrides: object = {}) =>
  ({
    id: "notification-1",
    userFullName: "Ada Lovelace",
    transactionId: "transaction-1",
    isRead: false,
    ...overrides,
  }) as unknown as NotificationResponseItem;

describe("NotificationListItem", () => {
  test("describes a comment notification", () => {
    render(
      <NotificationListItem
        notification={notification({ commentId: "comment-1" })}
        updateNotification={vi.fn()}
      />
    );

    expect(screen.getByTestId("notification-list-item-notification-1")).toHaveTextContent(
      "Ada Lovelace commented on a transaction."
    );
  });

  test("describes a like notification", () => {
    render(
      <NotificationListItem
        notification={notification({ likeId: "like-1" })}
        updateNotification={vi.fn()}
      />
    );

    expect(screen.getByTestId("notification-list-item-notification-1")).toHaveTextContent(
      "Ada Lovelace liked a transaction."
    );
  });

  test("describes a requested payment notification", () => {
    render(
      <NotificationListItem
        notification={notification({ status: PaymentNotificationStatus.requested })}
        updateNotification={vi.fn()}
      />
    );

    expect(screen.getByTestId("notification-list-item-notification-1")).toHaveTextContent(
      "Ada Lovelace requested payment."
    );
  });

  test("describes a received payment notification", () => {
    render(
      <NotificationListItem
        notification={notification({ status: PaymentNotificationStatus.received })}
        updateNotification={vi.fn()}
      />
    );

    expect(screen.getByTestId("notification-list-item-notification-1")).toHaveTextContent(
      "Ada Lovelace received payment."
    );
  });

  test("marks the notification as read when dismissed", () => {
    const updateNotification = vi.fn();
    render(
      <NotificationListItem
        notification={notification({ likeId: "like-1" })}
        updateNotification={updateNotification}
      />
    );

    fireEvent.click(screen.getByTestId("notification-mark-read-notification-1"));

    expect(updateNotification).toHaveBeenCalledWith({ id: "notification-1", isRead: true });
  });
});
