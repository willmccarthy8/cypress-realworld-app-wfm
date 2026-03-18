import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import NotificationsContainer from "./NotificationsContainer";

const mockUser = {
  id: "t45AiwidW",
  uuid: "6a5e77e0-f4b2-4b6e-9e5e-2f4b8e3f6c7a",
  firstName: "Edgar",
  lastName: "Johns",
  username: "Katharina_Bernier",
  password: "$2a$10$somehash",
  email: "Norene39@yahoo.com",
  phoneNumber: "625-316-9882",
  avatar: "https://cypress-realworld-app-avatar.s3.amazonaws.com/t45AiwidW.jpg",
  defaultPrivacyLevel: "public",
  balance: 168604,
  createdAt: new Date("2019-08-27T23:47:05.637Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

const mockNotifications = [
  {
    id: "noti1",
    uuid: "notif-uuid-1",
    userId: "t45AiwidW",
    transactionId: "tx1",
    isRead: false,
    createdAt: new Date("2020-06-01T12:00:00.000Z"),
    modifiedAt: new Date("2020-06-01T12:00:00.000Z"),
    status: "received",
    userFullName: "John Doe",
  },
  {
    id: "noti2",
    uuid: "notif-uuid-2",
    userId: "t45AiwidW",
    transactionId: "tx2",
    isRead: true,
    createdAt: new Date("2020-06-02T12:00:00.000Z"),
    modifiedAt: new Date("2020-06-02T12:00:00.000Z"),
    status: "requested",
    userFullName: "Jane Smith",
  },
];

const createAuthService = (user = mockUser) => {
  const machine = Machine({
    id: "testAuth",
    initial: "authorized",
    context: { user },
    states: {
      authorized: {},
      unauthorized: {},
    },
  });
  return interpret(machine).start();
};

const createNotificationsService = (results: any[] = []) => {
  const machine = Machine(
    {
      id: "testNotifications",
      initial: "success",
      context: { results, pageData: {} },
      states: {
        idle: {
          on: { FETCH: "success", UPDATE: "success" },
        },
        success: {
          initial: "unknown",
          on: { FETCH: "success", UPDATE: "success" },
          states: {
            unknown: {
              on: {
                "": [{ target: "withData", cond: "hasData" }, { target: "withoutData" }],
              },
            },
            withData: {},
            withoutData: {},
          },
        },
      },
    },
    {
      guards: {
        hasData: (ctx: any) => !!ctx.results && ctx.results.length > 0,
      },
    }
  );
  return interpret(machine).start();
};

describe("NotificationsContainer", () => {
  it("should render the Notifications heading", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer
          authService={authService}
          notificationsService={notificationsService}
        />
      </MemoryRouter>
    );

    cy.contains("Notifications").should("be.visible");
  });

  it("should render empty state when there are no notifications", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer
          authService={authService}
          notificationsService={notificationsService}
        />
      </MemoryRouter>
    );

    cy.contains("Notifications").should("be.visible");
    cy.get("[data-test=notifications-list]").should("not.exist");
  });

  it("should render notification list when notifications exist", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService(mockNotifications);

    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer
          authService={authService}
          notificationsService={notificationsService}
        />
      </MemoryRouter>
    );

    cy.get("[data-test=notifications-list]").should("exist");
  });
});
