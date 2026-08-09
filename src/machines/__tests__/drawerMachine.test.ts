import { describe, expect, test } from "vitest";
import { interpret } from "xstate";
import { drawerMachine } from "../drawerMachine";

describe("drawerMachine", () => {
  test("starts with the desktop drawer open and the mobile drawer closed", () => {
    const { initialState } = drawerMachine;

    expect(initialState.matches({ desktop: "open" })).toBe(true);
    expect(initialState.matches({ mobile: "closed" })).toBe(true);
  });

  test("toggles and closes the desktop drawer", () => {
    let state = drawerMachine.transition(drawerMachine.initialState, "TOGGLE_DESKTOP");
    expect(state.matches({ desktop: "closed" })).toBe(true);

    state = drawerMachine.transition(state, "TOGGLE_DESKTOP");
    expect(state.matches({ desktop: "open" })).toBe(true);

    state = drawerMachine.transition(state, "CLOSE_DESKTOP");
    expect(state.matches({ desktop: "closed" })).toBe(true);
  });

  test("toggles, opens and closes the mobile drawer independently", () => {
    let state = drawerMachine.transition(drawerMachine.initialState, "TOGGLE_MOBILE");
    expect(state.matches({ mobile: "open" })).toBe(true);
    expect(state.matches({ desktop: "open" })).toBe(true);

    state = drawerMachine.transition(state, "CLOSE_MOBILE");
    expect(state.matches({ mobile: "closed" })).toBe(true);

    state = drawerMachine.transition(state, "OPEN_MOBILE");
    expect(state.matches({ mobile: "open" })).toBe(true);

    state = drawerMachine.transition(state, "TOGGLE_MOBILE");
    expect(state.matches({ mobile: "closed" })).toBe(true);
  });

  test("only re-opens the desktop drawer when the breakpoint changed", () => {
    const service = interpret(
      drawerMachine.withContext({ aboveSmallBreakpoint: false } as any)
    ).start();

    service.send("CLOSE_DESKTOP");
    expect(service.getSnapshot().matches({ desktop: "closed" })).toBe(true);

    service.send("OPEN_DESKTOP");
    expect(service.getSnapshot().matches({ desktop: "closed" })).toBe(true);

    service.stop();
  });
});
