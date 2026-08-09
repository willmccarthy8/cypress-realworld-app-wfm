import React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { interpret } from "xstate";
import NotificationsContainer from "../NotificationsContainer";
import { authMachine } from "../../machines/authMachine";
import { dataMachine } from "../../machines/dataMachine";
import { NotificationResponseItem, User } from "../../models";

const currentUser = { id: "user-1" } as User;

const notifications = [
  { id: "notification-1", userFullName: "Ada Lovelace", likeId: "like-1" },
] as unknown as NotificationResponseItem[];

const startServices = (results: NotificationResponseItem[] = notifications) => {
  const fetchData = vi.fn().mockResolvedValue({ results });
  const updateData = vi.fn().mockResolvedValue({ results });
  const authService = interpret(authMachine.withContext({ user: currentUser } as any)).start();
  const notificationsService = interpret(
    dataMachine("notifications").withConfig({
      services: { fetchData, updateData, createData: vi.fn(), deleteData: vi.fn() },
    })
  ).start();
  return { authService, notificationsService, fetchData, updateData };
};

let services: ReturnType<typeof startServices>;

const renderContainer = (started = startServices()) => {
  services = started;
  render(
    <NotificationsContainer
      authService={services.authService as any}
      notificationsService={services.notificationsService as any}
    />
  );
};

afterEach(() => {
  services?.authService.stop();
  services?.notificationsService.stop();
});

describe("NotificationsContainer", () => {
  test("fetches and lists the unread notifications", async () => {
    renderContainer();

    expect(services.fetchData).toHaveBeenCalled();
    expect(await screen.findByTestId("notification-list-item-notification-1")).toHaveTextContent(
      "Ada Lovelace liked a transaction."
    );
  });

  test("marks a notification as read through the notifications machine", async () => {
    renderContainer();
    const dismiss = await screen.findByTestId("notification-mark-read-notification-1");

    fireEvent.click(dismiss);

    await waitFor(() => expect(services.updateData).toHaveBeenCalled());
    expect(services.updateData.mock.calls[0][1]).toMatchObject({
      type: "UPDATE",
      id: "notification-1",
      isRead: true,
    });
  });

  test("renders an empty list when there is nothing unread", async () => {
    renderContainer(startServices([]));

    await waitFor(() =>
      expect(screen.getByTestId("empty-list-header")).toHaveTextContent("No Notifications")
    );
  });
});
