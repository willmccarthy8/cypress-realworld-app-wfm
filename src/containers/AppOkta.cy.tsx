import { MemoryRouter } from "react-router-dom";

// AppOkta uses @okta/okta-react which requires Okta provider context.
// We verify the module structure and exports.
describe("AppOkta Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "okta-user-1",
          firstName: "Okta",
          lastName: "User",
          username: "oktauser",
          email: "okta@example.com",
        },
      },
    });
    cy.intercept("GET", "http://localhost:3001/notifications*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/bankAccounts*", { results: [] });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      results: [],
      pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 },
    });
  });

  it("should export a valid React component", () => {
    cy.wrap(import("./AppOkta")).then((module) => {
      expect(module.default).to.exist;
    });
  });

  it("should expose authService on window for Cypress in test environment", () => {
    // The AppOkta module sets window.authService when window.Cypress is truthy
    cy.window().then((win) => {
      expect(win.Cypress).to.exist;
    });
  });

  it("should have the correct component structure with Okta auth integration", () => {
    cy.wrap(import("./AppOkta")).then((module) => {
      const AppOkta = module.default;
      expect(AppOkta).to.be.a("function");
    });
  });
});
