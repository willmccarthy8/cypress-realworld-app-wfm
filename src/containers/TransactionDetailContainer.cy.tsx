import { MemoryRouter, Route } from "react-router-dom";
import { interpret } from "xstate";
import TransactionDetailContainer from "./TransactionDetailContainer";
import { authMachine } from "../machines/authMachine";

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

const mockTransaction = {
  id: "si_aNEMbyCA",
  uuid: "41754166-ea5b-448a-9a8a-374ce387c714",
  source: "GYDJUNEaOK7",
  amount: 8647,
  description: "Payment: db4uxOm7d to t45AiwidW",
  privacyLevel: "public",
  receiverId: "t45AiwidW",
  senderId: "db4uxOm7d",
  balanceAtCompletion: 8958,
  status: "complete",
  requestStatus: "",
  requestResolvedAt: "2020-06-09T19:01:15.675Z",
  createdAt: "2019-12-10T21:38:16.311Z",
  modifiedAt: "2020-05-06T08:15:48.263Z",
  receiverName: "Katharina Bernier",
  receiverAvatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
  senderName: "Amir Bartoletti",
  senderAvatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/db4uxOm7d.svg",
  likes: [],
  comments: [],
};

describe("TransactionDetailContainer", () => {
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

    return { testAuthService };
  };

  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: mockUser },
    });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: { user: mockUser },
    });
  });

  it("renders loading state initially", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/si_aNEMbyCA", {
      delay: 2000,
      statusCode: 200,
      body: { transaction: mockTransaction },
    });
    const { testAuthService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={testAuthService} />
        </Route>
      </MemoryRouter>
    );
    cy.contains("Loading...").should("exist");
  });

  it("renders transaction detail after data loads", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/si_aNEMbyCA", {
      statusCode: 200,
      body: { transaction: mockTransaction },
    });
    const { testAuthService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={testAuthService} />
        </Route>
      </MemoryRouter>
    );
    cy.get("[data-test=transaction-detail-header]").should("exist");
    cy.contains("Transaction Detail").should("exist");
  });

  it("displays transaction description and like button", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/si_aNEMbyCA", {
      statusCode: 200,
      body: { transaction: mockTransaction },
    });
    const { testAuthService } = setupServices();
    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={testAuthService} />
        </Route>
      </MemoryRouter>
    );
    cy.get("[data-test=transaction-detail-header]").should("exist");
    cy.get(`[data-test=transaction-like-button-${mockTransaction.id}]`).should("exist");
  });
});
