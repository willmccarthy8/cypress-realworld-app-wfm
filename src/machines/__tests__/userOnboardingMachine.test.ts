import { describe, expect, test } from "vitest";
import { userOnboardingMachine } from "../userOnboardingMachine";

describe("userOnboardingMachine", () => {
  test("starts on the first step", () => {
    expect(userOnboardingMachine.initialState.matches("stepOne")).toBe(true);
  });

  test("advances through every step to done", () => {
    let state = userOnboardingMachine.initialState;

    state = userOnboardingMachine.transition(state, "NEXT");
    expect(state.matches("stepTwo")).toBe(true);

    state = userOnboardingMachine.transition(state, "NEXT");
    expect(state.matches("stepThree")).toBe(true);

    state = userOnboardingMachine.transition(state, "NEXT");
    expect(state.matches("done")).toBe(true);
    expect(state.done).toBe(true);
  });

  test("steps backwards from the later steps", () => {
    const stepThree = userOnboardingMachine.transition("stepTwo", "NEXT");

    expect(userOnboardingMachine.transition(stepThree, "PREV").matches("stepTwo")).toBe(true);
    expect(userOnboardingMachine.transition("stepTwo", "PREV").matches("stepOne")).toBe(true);
  });

  test("cannot step back from the first step", () => {
    const state = userOnboardingMachine.transition("stepOne", "PREV");

    expect(state.matches("stepOne")).toBe(true);
    expect(state.changed).toBeFalsy();
  });

  test("leaves idle on the first advance", () => {
    expect(userOnboardingMachine.transition("idle", "NEXT").matches("stepOne")).toBe(true);
  });
});
