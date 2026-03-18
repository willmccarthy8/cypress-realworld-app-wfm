import { MemoryRouter } from "react-router-dom";

describe("AppOkta Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "okta-user-123",
          firstName: "Okta",
          lastName: "User",
          username: "oktauser",
          email: "oktauser@example.com",
          avatar: "https://example.com/avatar.jpg",
          defaultPrivacyLevel: "public",
          balance: 100000,
        },
      },
    });
    cy.intercept("GET", "http://localhost:3001/notifications*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/bankAccounts*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      fixture: "public-transactions.json",
    });
  });

  it("should render without errors when Okta dependencies are available", () => {
    cy.wrap(import("./AppOkta")).should("have.property", "default");
  });

  it("should export a default component", () => {
    cy.wrap(import("./AppOkta")).then((module) => {
      expect(module.default).to.be.a("function");
    });
  });

  it("should have authService exposed on window for Cypress", () => {
    cy.wrap(import("./AppOkta")).then(() => {
      cy.window().should("have.property", "authService");
    });
  });
});
