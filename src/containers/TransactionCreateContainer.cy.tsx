import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import TransactionCreateContainer from "./TransactionCreateContainer";

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

const mockUsers = [
  {
    id: "qywYp6hS0U",
    uuid: "user-uuid-2",
    firstName: "Devon",
    lastName: "Becker",
    username: "Devon39",
    email: "devon@example.com",
    phoneNumber: "555-123-4567",
    avatar: "https://example.com/avatar2.jpg",
    defaultPrivacyLevel: "public",
    balance: 50000,
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
    modifiedAt: new Date("2020-01-01T00:00:00.000Z"),
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

const createSnackbarService = () => {
  const machine = Machine({
    id: "testSnackbar",
    initial: "invisible",
    context: { severity: undefined, message: undefined },
    states: {
      invisible: {
        on: { SHOW: "visible" },
      },
      visible: {
        on: { HIDE: "invisible" },
      },
    },
  });
  return interpret(machine).start();
};

describe("TransactionCreateContainer", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/users*", {
      results: mockUsers,
    });
  });

  it("should render the stepper with three steps", () => {
    const authService = createAuthService();
    const snackbarService = createSnackbarService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer authService={authService} snackbarService={snackbarService} />
      </MemoryRouter>
    );

    cy.contains("Select Contact").should("be.visible");
    cy.contains("Payment").should("be.visible");
    cy.contains("Complete").should("be.visible");
  });

  it("should render step one - user selection", () => {
    const authService = createAuthService();
    const snackbarService = createSnackbarService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer authService={authService} snackbarService={snackbarService} />
      </MemoryRouter>
    );

    // Step one should be active (Select Contact)
    cy.contains("Select Contact").should("be.visible");
  });

  it("should display user list in step one", () => {
    const authService = createAuthService();
    const snackbarService = createSnackbarService();

    cy.mount(
      <MemoryRouter initialEntries={["/transaction/new"]}>
        <TransactionCreateContainer authService={authService} snackbarService={snackbarService} />
      </MemoryRouter>
    );

    // The user search input and list should be available in step one
    cy.get("[data-test=user-list-search-input]").should("exist");
  });
});
