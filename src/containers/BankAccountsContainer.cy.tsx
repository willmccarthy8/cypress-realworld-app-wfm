import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import BankAccountsContainer from "./BankAccountsContainer";
import { authMachine } from "../machines/authMachine";
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

const mockBankAccounts = [
  {
    id: "RskoB7r4Bic",
    uuid: "035b73ee-b267-4e98-a055-1f5505060a0b",
    userId: "t45AiwidW",
    bankName: "O'Hara - Labadie Bank",
    accountNumber: "6123387981",
    routingNumber: "851823229",
    isDeleted: false,
    createdAt: new Date("2020-01-21T05:33:09.187Z"),
    modifiedAt: new Date("2020-05-21T21:12:55.744Z"),
  },
];

describe("BankAccountsContainer", () => {
  const setupServices = (userOverride?: object, bankAccountResults?: object[]) => {
    const testAuthMachine = authMachine.withConfig({
      services: {
        performLogin: async () => ({ user: { ...mockUser, ...userOverride } }),
        getUserProfile: async () => ({ user: { ...mockUser, ...userOverride } }),
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

    const results = bankAccountResults !== undefined ? bankAccountResults : mockBankAccounts;
    const testBankAccountsMachine = bankAccountsMachine.withConfig({
      services: {
        fetchData: async () => ({ results, pageData: {} }),
        createData: async () => ({}),
        deleteData: async () => ({}),
      },
    });
    const testBankAccountsService = interpret(testBankAccountsMachine).start();

    return { testAuthService, testBankAccountsService };
  };

  it("renders without crashing", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.contains("Bank Accounts").should("exist");
  });

  it("displays bank accounts list when data is available", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=bankaccount-list]").should("exist");
    cy.get("[data-test=bankaccount-new]").should("exist");
  });

  it("shows empty state when no bank accounts exist", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testBankAccountsService } = setupServices(undefined, []);
    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts"]}>
        <BankAccountsContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=empty-list-header]").should("exist");
  });

  it("shows create bank account form on /bankaccounts/new route", () => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/bankaccounts/new"]}>
        <BankAccountsContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.contains("Create Bank Account").should("exist");
    cy.get("[data-test=bankaccount-form]").should("exist");
  });
});
