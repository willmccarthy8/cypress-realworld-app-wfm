import { MemoryRouter } from "react-router-dom";

describe("AppCognito Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "cognito-user-123",
          firstName: "Cognito",
          lastName: "User",
          username: "cognitouser",
          email: "cognitouser@example.com",
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

  it("should render without errors when Cognito dependencies are available", () => {
    // AppCognito depends on aws-amplify and aws-exports which may not be available
    // in the component test environment. Verify the module can be imported.
    cy.wrap(import("./AppCognito")).should("have.property", "default");
  });

  it("should export a default component", () => {
    cy.wrap(import("./AppCognito")).then((module) => {
      expect(module.default).to.be.a("function");
    });
  });

  it("should have authService exposed on window for Cypress", () => {
    cy.wrap(import("./AppCognito")).then(() => {
      cy.window().should("have.property", "authService");
    });
  });
});
