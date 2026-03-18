import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import NotificationsContainer from "./NotificationsContainer";

const mockUser = {
  id: "t45AiwidW",
  uuid: "6ebc7114-3e6e-4b34-bbce-f1c2d2f1a059",
  firstName: "Edgar",
  lastName: "Johns",
  username: "Katharina_Bernier",
  password: "$2a$10$a",
  email: "demo@demo.com",
  phoneNumber: "625-316-9882",
  balance: 110000,
  avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
  defaultPrivacyLevel: "public" as const,
  createdAt: new Date("2019-08-27T23:00:19.444Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

const mockNotifications = [
  {
    id: "noti1",
    uuid: "a1b2c3d4-e5f6-7890-abcd-111111111111",
    userId: "t45AiwidW",
    transactionId: "txn1",
    status: "received",
    isRead: false,
    createdAt: new Date("2020-06-01T00:00:00.000Z"),
    modifiedAt: new Date("2020-06-01T00:00:00.000Z"),
    userFullName: "Amir Khan",
  },
  {
    id: "noti2",
    uuid: "a1b2c3d4-e5f6-7890-abcd-222222222222",
    userId: "t45AiwidW",
    transactionId: "txn2",
    status: "requested",
    isRead: true,
    createdAt: new Date("2020-06-02T00:00:00.000Z"),
    modifiedAt: new Date("2020-06-02T00:00:00.000Z"),
    userFullName: "Ibrahim Dickens",
  },
];

function createMockAuthService(user = mockUser) {
  const machine = Machine<any, any, any>(
    {
      id: "mockAuth",
      initial: "authorized",
      context: { user },
      states: {
        authorized: { on: { LOGOUT: "unauthorized" } },
        unauthorized: {},
      },
    },
    { actions: {} }
  );
  return interpret(machine).start();
}

function createMockNotificationsService(notifications: any[] = []) {
  const machine = Machine<any, any, any>(
    {
      id: "mockNotifications",
      initial: "success",
      context: { results: notifications, pageData: {} },
      states: {
        idle: { on: { FETCH: "success", UPDATE: "success" } },
        success: {
          on: { FETCH: "success", UPDATE: "success" },
          initial: "unknown",
          states: {
            unknown: {
              always: [{ target: "withData", cond: "hasData" }, { target: "withoutData" }],
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
}

describe("Notifications Container", () => {
  it("should render notifications list with mock data", () => {
    const authService = createMockAuthService();
    const notificationsService = createMockNotificationsService(mockNotifications);

    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer authService={authService} notificationsService={notificationsService} />
      </MemoryRouter>
    );
    cy.contains("Notifications").should("be.visible");
    cy.get("[data-test=notifications-list]").should("exist");
  });

  it("should render empty state when no notifications", () => {
    const authService = createMockAuthService();
    const notificationsService = createMockNotificationsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer authService={authService} notificationsService={notificationsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=empty-list-header]").should("exist");
    cy.contains("No Notifications").should("be.visible");
  });
});
