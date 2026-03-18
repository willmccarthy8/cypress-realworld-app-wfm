import { MemoryRouter } from "react-router-dom";
import { interpret, Machine } from "xstate";
import UserSettingsContainer from "./UserSettingsContainer";

const mockUser = {
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
  defaultPrivacyLevel: "public" as const,
  createdAt: new Date("2019-08-27T23:00:19.444Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

function createMockAuthService(user = mockUser) {
  const machine = Machine<any, any, any>(
    {
      id: "mockAuth",
      initial: "authorized",
      context: { user },
      states: {
        authorized: { on: { LOGOUT: "unauthorized", UPDATE: "authorized" } },
        unauthorized: {},
      },
    },
    { actions: {} }
  );
  return interpret(machine).start();
}

describe("UserSettings Container", () => {
  it("should render user settings form with current user data", () => {
    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );
    cy.contains("User Settings").should("be.visible");
    cy.get("[data-test=user-settings-form]").should("exist");
    cy.get("[data-test=user-settings-firstName-input]").should("have.value", "Edgar");
    cy.get("[data-test=user-settings-lastName-input]").should("have.value", "Johns");
    cy.get("[data-test=user-settings-email-input]").should("have.value", "demo@demo.com");
    cy.get("[data-test=user-settings-phoneNumber-input]").should("have.value", "625-316-9882");
  });

  it("should have a save button", () => {
    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );
    cy.get("[data-test=user-settings-submit]").should("be.visible").and("contain", "Save");
  });

  it("should show validation error when first name is cleared", () => {
    const authService = createMockAuthService();

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );
    cy.get("[data-test=user-settings-firstName-input]").clear();
    cy.get("[data-test=user-settings-lastName-input]").click();
    cy.contains("Enter a first name").should("be.visible");
  });

  it("should not render form when no user is available", () => {
    const authService = createMockAuthService(undefined as any);

    cy.mount(
      <MemoryRouter initialEntries={["/user/settings"]}>
        <UserSettingsContainer authService={authService} />
      </MemoryRouter>
    );
    cy.contains("User Settings").should("be.visible");
    cy.get("[data-test=user-settings-form]").should("not.exist");
  });
});
