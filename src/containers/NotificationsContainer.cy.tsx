import { MemoryRouter } from "react-router-dom";
import { interpret } from "xstate";
import NotificationsContainer from "./NotificationsContainer";
import { authMachine } from "../machines/authMachine";
import { notificationsMachine } from "../machines/notificationsMachine";

const mockUser = {
  id: "t45AiwidW",
  uuid: "6a80e0e3-f4a2-4ebc-9a67-7cbbab0cf926",
  firstName: "Katharina",
  lastName: "Bernier",
  username: "Katharina_Bernier",
  password: "$2a$10$a/Vu3PGR2QCxUfLniac.cOFAkPaCV5dFAi3wWRkOxwDRJlgcSJnMu",
  email: "Norene39@yahoo.com",
  phoneNumber: "687-555-0172",
  balance: 168137,
  avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
  defaultPrivacyLevel: "public" as const,
  createdAt: new Date("2019-08-27T23:00:22.014Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

const mockNotifications = [
  {
    id: "LCxnVAGKjkb",
    uuid: "6a80e0e3-f4a2-4ebc-9a67-7cbbab0cf926",
    userId: "t45AiwidW",
    transactionId: "si_aNEMbyCA",
    status: "received",
    isRead: false,
    createdAt: new Date("2020-06-09T19:01:15.675Z"),
    modifiedAt: new Date("2020-06-09T19:01:15.675Z"),
    userFullName: "Amir Bartoletti",
  },
];

describe("NotificationsContainer", () => {
  const setupServices = (notificationResults?: object[]) => {
    const testAuthMachine = authMachine.withConfig({
      services: {
        performLogin: async () => ({ user: mockUser }),
        getUserProfile: async () => ({ user: mockUser }),
        performLogout: async () => ({}),
        performSignup: async () => ({}),
        updateProfile: async () => ({}),
        getGoogleUserProfile: async () => ({}),
        getAuth0UserProfile: async () => ({}),
        getOktaUserProfile: async () => ({}),
        getCognitoUserProfile: async () => ({}),
      },
      actions: {
        redirectHomeAfterLogin: () => {},
      },
    });
    const testAuthService = interpret(testAuthMachine).start();
    testAuthService.send("LOGIN");

    const results = notificationResults !== undefined ? notificationResults : mockNotifications;
    const testNotificationsMachine = notificationsMachine.withConfig({
      services: {
        fetchData: async () => ({ results, pageData: {} }),
        updateData: async () => ({}),
      },
    });
    const testNotificationsService = interpret(testNotificationsMachine).start();

    return { testAuthService, testNotificationsService };
  };

  it("renders without crashing", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testNotificationsService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer
          authService={testAuthService}
          notificationsService={testNotificationsService}
        />
      </MemoryRouter>
    );
    cy.contains("Notifications").should("exist");
  });

  it("displays notification list when data is available", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testNotificationsService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer
          authService={testAuthService}
          notificationsService={testNotificationsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=notifications-list]").should("exist");
  });

  it("shows empty state when no notifications exist", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testNotificationsService } = setupServices([]);
    cy.mount(
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsContainer
          authService={testAuthService}
          notificationsService={testNotificationsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=empty-list-header]").should("exist");
  });
});
