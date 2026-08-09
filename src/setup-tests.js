import { expect, afterEach } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import matchers from "@testing-library/jest-dom/matchers";

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// the app marks elements with `data-test`, matching the selectors used by the Cypress tests
configure({ testIdAttribute: "data-test" });

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
