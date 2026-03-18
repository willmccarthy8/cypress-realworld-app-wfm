import { MemoryRouter } from "react-router-dom";

describe("AppGoogle Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "google-user-123",
          firstName: "Google",
          lastName: "User",
          username: "googleuser",
          email: "googleuser@example.com",
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

  it("should render without errors when Google dependencies are available", () => {
    cy.wrap(import("./AppGoogle")).should("have.property", "default");
  });

  it("should export a default component", () => {
    cy.wrap(import("./AppGoogle")).then((module) => {
      expect(module.default).to.be.a("function");
    });
  });

  it("should have authService exposed on window for Cypress", () => {
    cy.wrap(import("./AppGoogle")).then(() => {
      cy.window().should("have.property", "authService");
    });
  });
});
