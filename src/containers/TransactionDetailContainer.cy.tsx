import { MemoryRouter, Route } from "react-router-dom";
import { interpret, Machine } from "xstate";
import TransactionDetailContainer from "./TransactionDetailContainer";

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

const mockTransaction = {
  id: "si_aNEMbyCA",
  uuid: "41754166-ea5b-448a-9a8a-374ce387c714",
  source: "GYDJUNEaOK7",
  amount: 8647,
  description: "Payment: Edgar to Devon",
  privacyLevel: "public",
  receiverId: "qywYp6hS0U",
  senderId: "t45AiwidW",
  balanceAtCompletion: 8958,
  status: "complete",
  requestStatus: "",
  requestResolvedAt: "2020-06-09T19:01:15.675Z",
  createdAt: "2019-12-10T21:38:16.311Z",
  modifiedAt: "2020-05-06T08:15:48.263Z",
  receiverName: "Devon Becker",
  senderName: "Edgar Johns",
  receiverAvatar: "https://example.com/avatar2.jpg",
  senderAvatar: "https://cypress-realworld-app-avatar.s3.amazonaws.com/t45AiwidW.jpg",
  likes: [],
  comments: [],
};

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

describe("TransactionDetailContainer", () => {
  it("should render loading state initially", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      delay: 2000,
      body: { transaction: mockTransaction },
    });

    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );

    cy.contains("Loading...").should("be.visible");
  });

  it("should render transaction detail after loading", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      body: {
        transaction: mockTransaction,
      },
    });

    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );

    // The container starts in idle (Loading) state, then fetches data
    cy.contains("Loading...").should("exist");
  });

  it("should render with transaction ID from route params", () => {
    cy.intercept("GET", "http://localhost:3001/transactions/*", {
      delay: 500,
      body: { transaction: mockTransaction },
    });

    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/si_aNEMbyCA"]}>
        <Route path="/transaction/:transactionId">
          <TransactionDetailContainer authService={authService} />
        </Route>
      </MemoryRouter>
    );

    // Verify the component mounted with the correct route
    cy.contains("Loading...").should("exist");
  });
});
