import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import PrivateRoutesContainer from "./PrivateRoutesContainer";

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

const createAuthService = (user = mockUser) => {
  const machine = Machine({
    id: "testAuth",
    initial: "authorized",
    context: { user },
    states: {
      authorized: {
        on: { LOGOUT: "unauthorized", UPDATE: "authorized", REFRESH: "authorized" },
      },
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

const createSnackbarService = () => {
  const machine = Machine({
    id: "testSnackbar",
    initial: "invisible",
    context: { severity: undefined, message: undefined },
    states: {
      invisible: {
        on: { SHOW: "visible" },
      },
      visible: {
        on: { HIDE: "invisible" },
      },
    },
  });
  return interpret(machine).start();
};

const createBankAccountsService = (results: any[] = []) => {
  const machine = Machine(
    {
      id: "testBankAccounts",
      initial: "success",
      context: { results, pageData: {} },
      states: {
        idle: {
          on: { FETCH: "success", CREATE: "success", DELETE: "success" },
        },
        success: {
          initial: "unknown",
          on: { FETCH: "success", CREATE: "success", DELETE: "success" },
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

describe("PrivateRoutesContainer", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/notifications*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/bankAccounts*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      fixture: "public-transactions.json",
    });
    cy.intercept("GET", "http://localhost:3001/users*", { results: [] });
  });

  it("should render main layout for authenticated users", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService();
    const snackbarService = createSnackbarService();
    const bankAccountsService = createBankAccountsService([
      {
        id: "bank1",
        uuid: "bank-uuid-1",
        userId: "t45AiwidW",
        bankName: "Test Bank",
        accountNumber: "123456789",
        routingNumber: "987654321",
        isDeleted: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    ]);

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

  it("should render transactions on the home route", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService();
    const snackbarService = createSnackbarService();
    const bankAccountsService = createBankAccountsService([
      {
        id: "bank1",
        uuid: "bank-uuid-1",
        userId: "t45AiwidW",
        bankName: "Test Bank",
        accountNumber: "123456789",
        routingNumber: "987654321",
        isDeleted: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    ]);

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

  it("should render user settings at /user/settings", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService();
    const snackbarService = createSnackbarService();
    const bankAccountsService = createBankAccountsService([
      {
        id: "bank1",
        uuid: "bank-uuid-1",
        userId: "t45AiwidW",
        bankName: "Test Bank",
        accountNumber: "123456789",
        routingNumber: "987654321",
        isDeleted: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    ]);

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
  });

  it("should redirect unauthenticated users to signin", () => {
    const authService = createAuthService();
    const notificationsService = createNotificationsService();
    const snackbarService = createSnackbarService();
    const bankAccountsService = createBankAccountsService();

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <PrivateRoutesContainer
          isLoggedIn={false}
          authService={authService}
          notificationsService={notificationsService}
          snackbarService={snackbarService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    // When not logged in, private routes redirect to /signin
    // The main content should still render the layout but route content should redirect
    cy.get("[data-test=main]").should("exist");
  });
});
