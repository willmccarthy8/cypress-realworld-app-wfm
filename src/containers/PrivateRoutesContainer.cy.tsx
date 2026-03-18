import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import PrivateRoutesContainer from "./PrivateRoutesContainer";

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

function createMockAuthService(user = mockUser) {
  const machine = Machine<any, any, any>(
    {
      id: "mockAuth",
      initial: "authorized",
      context: { user },
      states: {
        authorized: { on: { LOGOUT: "unauthorized", UPDATE: "authorized" } },
        unauthorized: {},
      },
    },
    { actions: {} }
  );
  return interpret(machine).start();
}

function createMockNotificationsService() {
  const machine = Machine<any, any, any>(
    {
      id: "mockNotifications",
      initial: "success",
      context: { results: [], pageData: {} },
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

function createMockSnackbarService() {
  const machine = Machine<any, any, any>(
    {
      id: "mockSnackbar",
      initial: "invisible",
      context: { severity: undefined, message: undefined },
      states: {
        invisible: { on: { SHOW: "visible" } },
        visible: { on: { HIDE: "invisible" } },
      },
    },
    { actions: {} }
  );
  return interpret(machine).start();
}

function createMockBankAccountsService() {
  const machine = Machine<any, any, any>(
    {
      id: "mockBankAccounts",
      initial: "success",
      context: { results: [], pageData: {} },
      states: {
        idle: { on: { FETCH: "success", CREATE: "success", DELETE: "success" } },
        success: {
          on: { FETCH: "success", CREATE: "success", DELETE: "success" },
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

describe("PrivateRoutes Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/notifications*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/bankAccounts*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      results: [],
      pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 },
    });
    cy.intercept("GET", "http://localhost:3001/users*", {
      results: [],
      pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 },
    });
  });

  it("should render MainLayout with navigation when logged in", () => {
    const authService = createMockAuthService();
    const notificationsService = createMockNotificationsService();
    const snackbarService = createMockSnackbarService();
    const bankAccountsService = createMockBankAccountsService();

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <PrivateRoutesContainer
          isLoggedIn={true}
          authService={authService}
          notificationsService={notificationsService}
          snackbarService={snackbarService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=main]").should("exist");
  });

  it("should redirect to signin when not logged in", () => {
    const authService = createMockAuthService();
    const notificationsService = createMockNotificationsService();
    const snackbarService = createMockSnackbarService();
    const bankAccountsService = createMockBankAccountsService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <PrivateRoutesContainer
          isLoggedIn={false}
          authService={authService}
          notificationsService={notificationsService}
          snackbarService={snackbarService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=user-settings-form]").should("not.exist");
  });

  it("should render user settings page when navigating to /user/settings", () => {
    const authService = createMockAuthService();
    const notificationsService = createMockNotificationsService();
    const snackbarService = createMockSnackbarService();
    const bankAccountsService = createMockBankAccountsService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <PrivateRoutesContainer
          isLoggedIn={true}
          authService={authService}
          notificationsService={notificationsService}
          snackbarService={snackbarService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );
    cy.contains("User Settings").should("be.visible");
    cy.get("[data-test=user-settings-form]").should("exist");
  });
});
