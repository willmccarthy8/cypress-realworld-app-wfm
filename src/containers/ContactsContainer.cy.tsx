import { MemoryRouter } from "react-router-dom";
import TransactionsContainer from "./TransactionsContainer";

describe("Contacts Container (TransactionsContainer at /contacts)", () => {
  it("renders without crashing on /contacts route", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/contacts"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("exist");
  });

  it("renders contacts transactions when data is available", () => {
    cy.intercept("http://localhost:3001/transactions/*", {
      fixture: "public-transactions.json",
    });
    cy.mount(
      <MemoryRouter initialEntries={["/contacts"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("not.exist");
    cy.get(".MuiListSubheader-root").should("contain", "Contacts");
  });

  it("shows empty state when no contacts transactions exist", () => {
    cy.intercept("http://localhost:3001/transactions/*", {
      statusCode: 200,
      body: { results: [], pageData: { page: 1, limit: 10, hasNextPages: false, totalPages: 0 } },
    });
    cy.mount(
      <MemoryRouter initialEntries={["/contacts"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("exist");
  });
});
