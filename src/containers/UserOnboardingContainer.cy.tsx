import { MemoryRouter } from "react-router-dom";
import { interpret } from "xstate";
import UserOnboardingContainer from "./UserOnboardingContainer";
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

describe("UserOnboardingContainer", () => {
  const setupServices = (bankAccountResults?: object[]) => {
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

    const results = bankAccountResults !== undefined ? bankAccountResults : [];
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

  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    cy.intercept("POST", "http://localhost:3001/graphql", {
      statusCode: 200,
      body: { data: { listBankAccount: [] } },
    });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: { user: mockUser },
    });
  });

  it("renders without crashing", () => {
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter>
        <UserOnboardingContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-dialog]").should("exist");
  });

  it("shows step one with Get Started title when no bank accounts", () => {
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter>
        <UserOnboardingContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-dialog-title]").should(
      "contain",
      "Get Started with Real World App"
    );
    cy.get("[data-test=user-onboarding-next]").should("exist").and("contain", "Next");
  });

  it("navigates to step two when Next is clicked", () => {
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter>
        <UserOnboardingContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-next]").click();
    cy.get("[data-test=user-onboarding-dialog-title]").should("contain", "Create Bank Account");
    cy.get("[data-test=bankaccount-form]").should("exist");
  });

  it("shows logout button on onboarding dialog", () => {
    const { testAuthService, testBankAccountsService } = setupServices();
    cy.mount(
      <MemoryRouter>
        <UserOnboardingContainer
          authService={testAuthService}
          bankAccountsService={testBankAccountsService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-logout]").should("exist").and("contain", "Logout");
  });
});
