import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import TransactionCreateContainer from "./TransactionCreateContainer";

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
        authorized: { on: { LOGOUT: "unauthorized" } },
        unauthorized: {},
      },
    },
    { actions: {} }
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

describe("TransactionCreate Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/users*", {
      results: [
        {
          id: "qywYp6hS0U",
          uuid: "b1b2c3d4-0000-0000-0000-111111111111",
          firstName: "Kaylin",
          lastName: "Haag",
          username: "Kaylin.Haag",
          avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/qywYp6hS0U.svg",
        },
        {
          id: "bDjUb4ir5O7",
          uuid: "b1b2c3d4-0000-0000-0000-222222222222",
          firstName: "Amir",
          lastName: "Khan",
          username: "Amir.Khan",
          avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/bDjUb4ir5O7.svg",
        },
      ],
      pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 1 },
    });
    cy.intercept("POST", "http://localhost:3001/transactions", {
      statusCode: 200,
      body: { transaction: { id: "new-txn-123" } },
    });
  });

  it("should render step one - select contact", () => {
    const authService = createMockAuthService();
    const snackbarService = createMockSnackbarService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer authService={authService} snackbarService={snackbarService} />
      </MemoryRouter>
    );
    cy.contains("Select Contact").should("be.visible");
    cy.contains("Payment").should("be.visible");
    cy.contains("Complete").should("be.visible");
  });

  it("should render the stepper with three steps", () => {
    const authService = createMockAuthService();
    const snackbarService = createMockSnackbarService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer authService={authService} snackbarService={snackbarService} />
      </MemoryRouter>
    );
    cy.get(".MuiStep-root").should("have.length", 3);
    cy.get(".MuiStepLabel-label").eq(0).should("contain", "Select Contact");
    cy.get(".MuiStepLabel-label").eq(1).should("contain", "Payment");
    cy.get(".MuiStepLabel-label").eq(2).should("contain", "Complete");
  });

  it("should display user list for selecting a contact", () => {
    const authService = createMockAuthService();
    const snackbarService = createMockSnackbarService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer authService={authService} snackbarService={snackbarService} />
      </MemoryRouter>
    );
    cy.get("[data-test*=user-list-item]").should("have.length.at.least", 1);
  });
});
