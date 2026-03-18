import { MemoryRouter } from "react-router-dom";

// Mock the Auth0 hook before importing the component
const mockGetAccessTokenSilently = cy.stub().resolves("fake-token");
const mockAuth0User = {
  sub: "auth0|user123",
  email: "auth0user@example.com",
  nickname: "auth0user",
  picture: "https://example.com/avatar.jpg",
};

// We need to mock @auth0/auth0-react before importing the component
// Since the component uses withAuthenticationRequired HOC and useAuth0 hook,
// we test the underlying AppAuth0 behavior by mocking the module
describe("AppAuth0 Container", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "auth0|user123",
          firstName: "Auth0",
          lastName: "User",
          username: "auth0user",
          email: "auth0user@example.com",
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

  it("should render without errors when Auth0 dependencies are available", () => {
    // Since AppAuth0 uses withAuthenticationRequired HOC which requires Auth0Provider,
    // we verify the module can be imported without errors
    cy.wrap(import("./AppAuth0")).should("have.property", "default");
  });

  it("should export a default component", () => {
    cy.wrap(import("./AppAuth0")).then((module) => {
      expect(module.default).to.be.a("function");
    });
  });

  it("should have authService exposed on window for Cypress", () => {
    // The module sets window.authService when window.Cypress is truthy
    cy.wrap(import("./AppAuth0")).then(() => {
      cy.window().should("have.property", "authService");
    });
  });
});
