import { MemoryRouter, Route } from "react-router-dom";
import { interpret, Machine } from "xstate";
import TransactionDetailContainer from "./TransactionDetailContainer";

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

const mockTransaction = {
  id: "si_aNEMbyCA",
  uuid: "41754166-ea5b-448a-9a8a-374ce387c714",
  source: "GYDJUNEaOK7",
  amount: 8647,
  description: "Payment: Edgar to Amir",
  privacyLevel: "public",
  receiverId: "bDjUb4ir5O7",
  senderId: "t45AiwidW",
  balanceAtCompletion: 8958,
  status: "complete",
  requestStatus: "",
  requestResolvedAt: "2020-06-09T19:01:15.675Z",
  createdAt: "2019-12-10T21:38:16.311Z",
  modifiedAt: "2020-05-06T08:15:48.263Z",
  receiverName: "Amir Khan",
  senderName: "Edgar Johns",
  receiverAvatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/bDjUb4ir5O7.svg",
  senderAvatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
  likes: [],
  comments: [],
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

describe("TransactionDetail Container", () => {
  it("should render loading state initially", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      delay: 5000,
      body: { transaction: mockTransaction },
    });

    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );
    cy.contains("Loading...").should("be.visible");
  });

  it("should render transaction detail with mock data", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      body: { transaction: mockTransaction },
    });

    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );
    cy.get("[data-test=transaction-detail-header]").should("contain", "Transaction Detail");
    cy.get("[data-test=transaction-description]").should("contain", "Payment: Edgar to Amir");
  });

  it("should render like button for transaction", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      body: { transaction: mockTransaction },
    });

    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );
    cy.get(`[data-test=transaction-like-button-${mockTransaction.id}]`).should("exist");
    cy.get(`[data-test=transaction-like-count-${mockTransaction.id}]`).should("contain", "0");
  });

  it("should render accept/reject buttons for pending request received by current user", () => {
    const pendingRequestTransaction = {
      ...mockTransaction,
      id: "pending-req-1",
      status: "pending",
      requestStatus: "pending",
      senderId: "bDjUb4ir5O7",
      receiverId: "t45AiwidW",
    };

    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      body: { transaction: pendingRequestTransaction },
    });

    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/pending-req-1"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );
    cy.get(`[data-test=transaction-accept-request-${pendingRequestTransaction.id}]`).should("exist");
    cy.get(`[data-test=transaction-reject-request-${pendingRequestTransaction.id}]`).should("exist");
  });
});
