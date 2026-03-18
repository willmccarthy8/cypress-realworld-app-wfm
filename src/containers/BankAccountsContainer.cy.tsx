import { MemoryRouter } from "react-router-dom";
import { interpret, Machine, assign } from "xstate";
import BankAccountsContainer from "./BankAccountsContainer";

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

const mockBankAccounts = [
  {
    id: "RskoB7r4Bic",
    uuid: "a]5a5234-d7c1-4e29-8a1b-111111111111",
    userId: "t45AiwidW",
    bankName: "O'Hara - Labadie Bank",
    accountNumber: "6123456789",
    routingNumber: "851823229",
    isDeleted: false,
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
    modifiedAt: new Date("2020-01-01T00:00:00.000Z"),
  },
  {
    id: "bDjUb4ir5O7",
    uuid: "b5a5234-d7c1-4e29-8a1b-222222222222",
    userId: "t45AiwidW",
    bankName: "Schulist - Lueilwitz Bank",
    accountNumber: "9876543210",
    routingNumber: "124875693",
    isDeleted: false,
    createdAt: new Date("2020-02-01T00:00:00.000Z"),
    modifiedAt: new Date("2020-02-01T00:00:00.000Z"),
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
    {
      actions: {},
    }
  );
  return interpret(machine).start();
}

function createMockBankAccountsService(bankAccounts: any[] = []) {
  const machine = Machine<any, any, any>(
    {
      id: "mockBankAccounts",
      initial: "success",
      context: { results: bankAccounts, pageData: {} },
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

describe("BankAccounts Container", () => {
  it("should render bank accounts list with mock data", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService(mockBankAccounts);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=bankaccount-list]").should("exist");
    cy.contains("Bank Accounts").should("be.visible");
    cy.get("[data-test=bankaccount-new]").should("be.visible").and("contain", "Create");
  });

  it("should render empty state when no bank accounts", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=empty-list-header]").should("exist");
  });

  it("should render create bank account form on /bankaccounts/new", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts/new"]}>
        <BankAccountsContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.contains("Create Bank Account").should("be.visible");
    cy.get("[data-test=bankaccount-form]").should("exist");
    cy.get("[data-test=bankaccount-bankName-input]").should("be.visible");
    cy.get("[data-test=bankaccount-routingNumber-input]").should("be.visible");
    cy.get("[data-test=bankaccount-accountNumber-input]").should("be.visible");
    cy.get("[data-test=bankaccount-submit]").should("be.visible");
  });
});
