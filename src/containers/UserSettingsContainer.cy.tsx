import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import UserSettingsContainer from "./UserSettingsContainer";

const mockUser = {
  id: "t45AiwidW",
  uuid: "6a5e77e0-f4b2-4b6e-9e5e-2f4b8e3f6c7a",
  firstName: "Edgar",
  lastName: "Johns",
  username: "Katharina_Bernier",
  password: "$2a$10$somehash",
  email: "Norene39@yahoo.com",
  phoneNumber: "625-316-9882",
  avatar: "https://cypress-realworld-app-avatar.s3.amazonaws.com/t45AiwidW.jpg",
  defaultPrivacyLevel: "public",
  balance: 168604,
  createdAt: new Date("2019-08-27T23:47:05.637Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

const createAuthService = (user = mockUser) => {
  const machine = Machine({
    id: "testAuth",
    initial: "authorized",
    context: { user },
    states: {
      authorized: {
        on: { UPDATE: "authorized", LOGOUT: "unauthorized" },
      },
      unauthorized: {},
    },
  });
  return interpret(machine).start();
};

describe("UserSettingsContainer", () => {
  it("should render User Settings heading", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.contains("User Settings").should("be.visible");
  });

  it("should render the user settings form with user data", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.get("[data-test=user-settings-form]").should("exist");
    cy.get("[data-test=user-settings-firstName-input]").should("have.value", "Edgar");
    cy.get("[data-test=user-settings-lastName-input]").should("have.value", "Johns");
    cy.get("[data-test=user-settings-email-input]").should("have.value", "Norene39@yahoo.com");
    cy.get("[data-test=user-settings-phoneNumber-input]").should("have.value", "625-316-9882");
  });

  it("should render the Save button", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.get("[data-test=user-settings-submit]").should("be.visible").and("contain", "Save");
  });

  it("should allow editing the first name field", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.get("[data-test=user-settings-firstName-input]")
      .clear()
      .type("NewFirstName")
      .should("have.value", "NewFirstName");
  });

  it("should show validation error when first name is cleared", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.get("[data-test=user-settings-firstName-input]").clear();
    cy.get("[data-test=user-settings-lastName-input]").click(); // trigger blur
    cy.contains("Enter a first name").should("be.visible");
  });

  it("should show validation error for invalid email", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.get("[data-test=user-settings-email-input]").clear().type("invalid-email");
    cy.get("[data-test=user-settings-firstName-input]").click(); // trigger blur
    cy.contains("Must contain a valid email address").should("be.visible");
  });

  it("should disable Save button when form is invalid", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    cy.get("[data-test=user-settings-firstName-input]").clear();
    cy.get("[data-test=user-settings-submit]").should("be.disabled");
  });

  it("should render the personal settings illustration", () => {
    const authService = createAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );

    // The SVG illustration component should be rendered
    cy.get("svg").should("exist");
  });
});
