import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import UserOnboardingContainer from "./UserOnboardingContainer";

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

describe("UserOnboarding Container", () => {
  it("should render the onboarding dialog when user has no bank accounts", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-dialog]").should("exist");
    cy.get("[data-test=user-onboarding-dialog-title]").should(
      "contain",
      "Get Started with Real World App"
    );
  });

  it("should show Next button on step one", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-next]").should("be.visible").and("contain", "Next");
  });

  it("should navigate to step two (Create Bank Account) when Next is clicked", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-next]").click();
    cy.get("[data-test=user-onboarding-dialog-title]").should("contain", "Create Bank Account");
    cy.get("[data-test=bankaccount-form]").should("exist");
  });

  it("should show Logout button", () => {
    const authService = createMockAuthService();
    const bankAccountsService = createMockBankAccountsService([]);

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer authService={authService} bankAccountsService={bankAccountsService} />
      </MemoryRouter>
    );
    cy.get("[data-test=user-onboarding-logout]").should("be.visible").and("contain", "Logout");
  });
});
