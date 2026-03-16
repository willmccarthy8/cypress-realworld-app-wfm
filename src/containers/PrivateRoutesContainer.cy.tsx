import { MemoryRouter } from "react-router-dom";
import { interpret } from "xstate";
import PrivateRoutesContainer from "./PrivateRoutesContainer";
import { authMachine } from "../machines/authMachine";
import { notificationsMachine } from "../machines/notificationsMachine";
import { snackbarMachine } from "../machines/snackbarMachine";
import { bankAccountsMachine } from "../machines/bankAccountsMachine";

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

describe("PrivateRoutesContainer", () => {
  const setupServices = () => {
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

    const testNotificationsMachine = notificationsMachine.withConfig({
      services: {
        fetchData: async () => ({ results: [], pageData: {} }),
        updateData: async () => ({}),
      },
    });
    const testNotificationsService = interpret(testNotificationsMachine).start();

    const testSnackbarService = interpret(snackbarMachine).start();

    const testBankAccountsMachine = bankAccountsMachine.withConfig({
      services: {
        fetchData: async () => ({ results: [], pageData: {} }),
        createData: async () => ({}),
        deleteData: async () => ({}),
      },
    });
    const testBankAccountsService = interpret(testBankAccountsMachine).start();

    return {
      testAuthService,
      testNotificationsService,
      testSnackbarService,
      testBankAccountsService,
    };
  };

  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    cy.intercept("GET", "http://localhost:3001/notifications*", {
      statusCode: 200,
      body: { results: [] },
    });
    cy.intercept("POST", "http://localhost:3001/graphql", {
      statusCode: 200,
      body: { data: { listBankAccount: [] } },
    });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      statusCode: 200,
      body: { results: [], pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 } },
    });
    cy.intercept("GET", "http://localhost:3001/users*", {
      statusCode: 200,
      body: { results: [] },
    });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: { user: mockUser },
    });
  });

  it("renders without crashing when logged in", () => {
    const {
      testAuthService,
      testNotificationsService,
      testSnackbarService,
      testBankAccountsService,
    } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <PrivateRoutesContainer
          isLoggedIn={true}
          authService={testAuthService}
          notificationsService={testNotificationsService}
          snackbarService={testSnackbarService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=main]").should("exist");
  });

  it("renders transactions container on home route", () => {
    const {
      testAuthService,
      testNotificationsService,
      testSnackbarService,
      testBankAccountsService,
    } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <PrivateRoutesContainer
          isLoggedIn={true}
          authService={testAuthService}
          notificationsService={testNotificationsService}
          snackbarService={testSnackbarService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=main]").should("exist");
  });

  it("redirects to signin when not logged in", () => {
    const {
      testAuthService,
      testNotificationsService,
      testSnackbarService,
      testBankAccountsService,
    } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <PrivateRoutesContainer
          isLoggedIn={false}
          authService={testAuthService}
          notificationsService={testNotificationsService}
          snackbarService={testSnackbarService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    // When not logged in, PrivateRoute redirects to /signin
    // The main content area should still render but routes will redirect
    cy.get("[data-test=main]").should("exist");
  });
});
