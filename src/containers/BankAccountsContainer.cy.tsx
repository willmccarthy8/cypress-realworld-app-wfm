import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import BankAccountsContainer from "./BankAccountsContainer";

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

const mockBankAccounts = [
  {
    id: "RskoB7r4Bic",
    uuid: "a]bf7e7a-6e45-4c67-8b4a-1c9e7b3a5d6f",
    userId: "t45AiwidW",
    bankName: "O'Hara - Macejkovic Bank",
    accountNumber: "6123387981",
    routingNumber: "851823229",
    isDeleted: false,
    createdAt: new Date("2020-01-15T10:30:00.000Z"),
    modifiedAt: new Date("2020-01-15T10:30:00.000Z"),
  },
  {
    id: "bDjUb4ir5O7",
    uuid: "b2c7e8f9-1234-5678-9abc-def012345678",
    userId: "t45AiwidW",
    bankName: "First National Bank",
    accountNumber: "9876543210",
    routingNumber: "091000019",
    isDeleted: false,
    createdAt: new Date("2020-02-20T14:00:00.000Z"),
    modifiedAt: new Date("2020-02-20T14:00:00.000Z"),
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

const createBankAccountsService = (results: any[] = [], withData = false) => {
  const machine = Machine(
    {
      id: "testBankAccounts",
      initial: withData ? "success" : "idle",
      context: { results, pageData: {} },
      states: {
        idle: {
          on: {
            FETCH: "success",
            CREATE: "success",
            DELETE: "success",
          },
        },
        success: {
          initial: "unknown",
          on: {
            FETCH: "success",
            CREATE: "success",
            DELETE: "success",
          },
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

describe("BankAccountsContainer", () => {
  it("should render bank accounts list heading", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService(mockBankAccounts, true);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );

    cy.contains("Bank Accounts").should("be.visible");
  });

  it("should render the Create button", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService(mockBankAccounts, true);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );

    cy.get("[data-test=bankaccount-new]").should("be.visible").and("contain", "Create");
  });

  it("should render bank account list with data", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService(mockBankAccounts, true);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );

    cy.get("[data-test=bankaccount-list]").should("exist");
  });

  it("should render empty state when no bank accounts", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], false);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );

    cy.contains("Bank Accounts").should("be.visible");
  });

  it("should render the create bank account form at /bankaccounts/new", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], false);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts/new"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );

    cy.contains("Create Bank Account").should("be.visible");
    cy.get("[data-test=bankaccount-bankName-input]").should("exist");
    cy.get("[data-test=bankaccount-routingNumber-input]").should("exist");
    cy.get("[data-test=bankaccount-accountNumber-input]").should("exist");
    cy.get("[data-test=bankaccount-submit]").should("exist");
  });
});
