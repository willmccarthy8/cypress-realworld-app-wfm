import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App Container", () => {
  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: {
        user: {
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
          createdAt: "2019-08-27T23:47:05.637Z",
          modifiedAt: "2020-05-21T11:02:22.857Z",
        },
      },
    });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "t45AiwidW",
          firstName: "Edgar",
          lastName: "Johns",
          username: "Katharina_Bernier",
          email: "Norene39@yahoo.com",
          avatar: "https://cypress-realworld-app-avatar.s3.amazonaws.com/t45AiwidW.jpg",
          defaultPrivacyLevel: "public",
          balance: 168604,
        },
      },
    });
    cy.intercept("GET", "http://localhost:3001/notifications*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/bankAccounts*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      fixture: "public-transactions.json",
    });
  });

  it("should render the sign in page when unauthorized", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signin"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("be.visible");
    cy.get("[data-test=signin-password]").should("be.visible");
    cy.get("[data-test=signin-submit]").should("be.visible");
  });

  it("should render the sign up link on sign in page", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signin"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signup]").should("be.visible").and("contain", "Don't have an account? Sign Up");
  });

  it("should redirect to sign in page when accessing root while unauthorized", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("be.visible");
  });

  it("should render the sign up form at /signup", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signup-first-name]").should("be.visible");
    cy.get("[data-test=signup-last-name]").should("be.visible");
    cy.get("[data-test=signup-username]").should("be.visible");
    cy.get("[data-test=signup-password]").should("be.visible");
    cy.get("[data-test=signup-confirmPassword]").should("be.visible");
  });
});
