import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App Container", () => {
  beforeEach(() => {
    cy.intercept("POST", "http://localhost:3001/login", {
      statusCode: 200,
      body: {
        user: {
          id: "t45AiwidW",
          uuid: "6ebc7114-3e6e-4b34-bbce-f1c2d2f1a059",
          firstName: "Edgar",
          lastName: "Johns",
          username: "Katharina_Bernier",
          password: "$2a$10$a",
          email: "demo@demo.com",
          phoneNumber: "625-316-9882",
          balance: 110000,
          avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
          defaultPrivacyLevel: "public",
          createdAt: "2019-08-27T23:00:19.444Z",
          modifiedAt: "2020-05-21T11:02:22.857Z",
        },
      },
    });
    cy.intercept("POST", "http://localhost:3001/logout", { statusCode: 200 });
    cy.intercept("GET", "http://localhost:3001/checkAuth", {
      statusCode: 200,
      body: {
        user: {
          id: "t45AiwidW",
          firstName: "Edgar",
          lastName: "Johns",
          username: "Katharina_Bernier",
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

  it("should render the signin page when unauthorized", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signin"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("be.visible");
    cy.get("[data-test=signin-password]").should("be.visible");
    cy.get("[data-test=signin-submit]").should("be.visible");
  });

  it("should render the signup page", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signup-title]").should("contain", "Sign Up");
    cy.get("[data-test=signup-first-name]").should("be.visible");
    cy.get("[data-test=signup-last-name]").should("be.visible");
    cy.get("[data-test=signup-username]").should("be.visible");
    cy.get("[data-test=signup-password]").should("be.visible");
    cy.get("[data-test=signup-confirmPassword]").should("be.visible");
  });

  it("should redirect unauthenticated users to signin", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/personal"]}>
        <App />
      </MemoryRouter>
    );
    cy.get("[data-test=signin-username]").should("be.visible");
  });
});
