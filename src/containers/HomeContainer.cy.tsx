import { MemoryRouter } from "react-router-dom";
import TransactionsContainer from "./TransactionsContainer";

describe("Home Container (TransactionsContainer at /)", () => {
  it("renders without crashing on home route", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("exist");
  });

  it("renders public transactions feed on home route", () => {
    cy.intercept("http://localhost:3001/transactions/*", {
      fixture: "public-transactions.json",
    });
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("not.exist");
    cy.get(".MuiListSubheader-root").should("contain", "Public");
  });

  it("shows empty state when no transactions exist", () => {
    cy.intercept("http://localhost:3001/transactions/*", {
      statusCode: 200,
      body: { results: [], pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 } },
    });
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("exist");
  });
});
