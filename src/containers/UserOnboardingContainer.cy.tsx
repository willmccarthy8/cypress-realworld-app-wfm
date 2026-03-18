import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import UserOnboardingContainer from "./UserOnboardingContainer";

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
        on: { LOGOUT: "unauthorized", UPDATE: "authorized" },
      },
      unauthorized: {},
    },
  });
  return interpret(machine).start();
};

const createBankAccountsService = (results: any[] = [], initialState = "success") => {
  const machine = Machine(
    {
      id: "testBankAccounts",
      initial: initialState,
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

describe("UserOnboardingContainer", () => {
  it("should render the onboarding dialog when no bank accounts exist", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], "success");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer
          authService={authService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    cy.get("[data-test=user-onboarding-dialog]").should("exist");
  });

  it("should show step one title: Get Started with Real World App", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], "success");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer
          authService={authService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    cy.get("[data-test=user-onboarding-dialog-title]").should(
      "contain",
      "Get Started with Real World App"
    );
  });

  it("should display Next button on step one", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], "success");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer
          authService={authService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    cy.get("[data-test=user-onboarding-next]").should("be.visible").and("contain", "Next");
  });

  it("should display Logout button", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], "success");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer
          authService={authService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    cy.get("[data-test=user-onboarding-logout]").should("be.visible").and("contain", "Logout");
  });

  it("should advance to step two (Create Bank Account) when Next is clicked", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService([], "success");

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer
          authService={authService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    cy.get("[data-test=user-onboarding-next]").click();
    cy.get("[data-test=user-onboarding-dialog-title]").should("contain", "Create Bank Account");
    cy.get("[data-test=bankaccount-bankName-input]").should("exist");
    cy.get("[data-test=bankaccount-routingNumber-input]").should("exist");
    cy.get("[data-test=bankaccount-accountNumber-input]").should("exist");
  });

  it("should not show the dialog visibly when bank accounts exist and onboarding is done", () => {
    const authService = createAuthService();
    const bankAccountsService = createBankAccountsService(
      [
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
      ],
      "success"
    );

    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <UserOnboardingContainer
          authService={authService}
          bankAccountsService={bankAccountsService}
        />
      </MemoryRouter>
    );

    // When bank accounts exist and onboarding is complete, the MUI Dialog's open prop
    // is false, so its content should not be visible to the user
    cy.get("[data-test=user-onboarding-dialog-title]").should("not.be.visible");
  });
});
