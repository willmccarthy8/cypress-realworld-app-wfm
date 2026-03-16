import { MemoryRouter } from "react-router-dom";
import { interpret } from "xstate";
import TransactionCreateContainer from "./TransactionCreateContainer";
import { authMachine } from "../machines/authMachine";
import { snackbarMachine } from "../machines/snackbarMachine";

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

const mockUsers = [
  {
    id: "qywYp6hS0U",
    uuid: "3fe5bdc5-6a32-4b26-bfe0-8d9849e80e23",
    firstName: "Edgar",
    lastName: "Johns",
    username: "Edgar_Johns",
    password: "$2a$10$a/Vu3PGR2QCxUfLniac.cOFAkPaCV5dFAi3wWRkOxwDRJlgcSJnMu",
    email: "Edgar39@yahoo.com",
    phoneNumber: "687-555-0173",
    balance: 200000,
    avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/qywYp6hS0U.svg",
    defaultPrivacyLevel: "public" as const,
    createdAt: new Date("2019-08-27T23:00:22.014Z"),
    modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
  },
];

describe("TransactionCreateContainer", () => {
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

    const testSnackbarService = interpret(snackbarMachine).start();

    return { testAuthService, testSnackbarService };
  };

  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    cy.intercept("GET", "http://localhost:3001/users", {
      statusCode: 200,
      body: { results: mockUsers },
    });
    cy.intercept("GET", "http://localhost:3001/users/search*", {
      statusCode: 200,
      body: { results: mockUsers },
    });
    cy.intercept("POST", "http://localhost:3001/transactions", {
      statusCode: 200,
      body: { transaction: {} },
    });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: { user: mockUser },
    });
  });

  it("renders without crashing and shows step one", () => {
    const { testAuthService, testSnackbarService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer
          authService={testAuthService}
          snackbarService={testSnackbarService}
        />
      </MemoryRouter>
    );
    cy.contains("Select Contact").should("exist");
    cy.contains("Payment").should("exist");
    cy.contains("Complete").should("exist");
  });

  it("shows the stepper with three steps", () => {
    const { testAuthService, testSnackbarService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer
          authService={testAuthService}
          snackbarService={testSnackbarService}
        />
      </MemoryRouter>
    );
    cy.get(".MuiStepper-root").should("exist");
    cy.get(".MuiStep-root").should("have.length", 3);
  });

  it("displays user list in step one", () => {
    const { testAuthService, testSnackbarService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer
          authService={testAuthService}
          snackbarService={testSnackbarService}
        />
      </MemoryRouter>
    );
    cy.get("[data-test*=user-list-item]").should("exist");
  });
});
