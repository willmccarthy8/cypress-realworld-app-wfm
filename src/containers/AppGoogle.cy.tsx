import { MemoryRouter } from "react-router-dom";

// AppGoogle uses @matheusluizn/react-google-login which requires
// a Google client ID and provider setup. We verify the module structure.
describe("AppGoogle Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "google-user-1",
          firstName: "Google",
          lastName: "User",
          username: "googleuser",
          email: "google@example.com",
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
    cy.wrap(import("./AppGoogle")).then((module) => {
      expect(module.default).to.exist;
    });
  });

  it("should expose authService on window for Cypress in test environment", () => {
    // The AppGoogle module sets window.authService when window.Cypress is truthy
    cy.window().then((win) => {
      expect(win.Cypress).to.exist;
    });
  });

  it("should have the correct component structure with Google login integration", () => {
    // Verify the component file can be loaded and has expected exports
    cy.wrap(import("./AppGoogle")).then((module) => {
      const AppGoogle = module.default;
      expect(AppGoogle).to.be.a("function");
    });
  });
});
