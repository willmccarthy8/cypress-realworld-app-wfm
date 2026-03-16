import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import App from "./App";
import { authMachine, authService } from "../machines/authMachine";

describe("App Container", () => {
  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: { user: { id: "t45AiwidW", username: "Katharina_Bernier" } },
    });
    cy.intercept("POST", "http://localhost:3001/logout", { statusCode: 200 });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: { user: { id: "t45AiwidW", username: "Katharina_Bernier" } },
    });
    cy.intercept("GET", "http://localhost:3001/notifications*", {
      statusCode: 200,
      body: { results: [] },
    });
    cy.intercept("POST", "http://localhost:3001/graphql", {
      statusCode: 200,
      body: { data: { listBankAccount: [] } },
    });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      statusCode: 200,
      body: { results: [], pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 } },
    });
  });

  it("renders without crashing in unauthorized state", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signin"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("exist");
    cy.get("[data-test=signin-submit]").should("exist");
  });

  it("shows sign in form when unauthorized", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signin"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("be.visible");
    cy.get("[data-test=signin-password]").should("be.visible");
    cy.get("[data-test=signin-submit]").should("be.visible");
    cy.get("[data-test=signin-remember-me]").should("exist");
  });

  it("redirects to sign in when visiting unknown route while unauthorized", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/some-unknown-route"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("exist");
  });

  it("shows sign up form on /signup route", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signup-title]").should("exist");
    cy.get("[data-test=signup-first-name]").should("exist");
    cy.get("[data-test=signup-submit]").should("exist");
  });
});
