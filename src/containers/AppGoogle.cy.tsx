import { MemoryRouter } from "react-router-dom";

// AppGoogle relies on @matheusluizn/react-google-login hooks.
// We verify the module structure and exports.
describe("AppGoogle Container", () => {
  beforeEach(() => {
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
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: { user: { id: "t45AiwidW", username: "Katharina_Bernier" } },
    });
  });

  it("exports a default component", () => {
    cy.wrap(import("./AppGoogle")).then((module) => {
      expect(module.default).to.be.a("function");
    });
  });

  it("module can be imported without errors", () => {
    cy.wrap(import("./AppGoogle")).should("have.property", "default");
  });

  it("component is a valid React component", () => {
    cy.wrap(import("./AppGoogle")).then((module) => {
      const AppGoogle = module.default;
      expect(typeof AppGoogle).to.equal("function");
    });
  });
});
