import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { interpret } from "xstate";
import { Severities, snackbarMachine } from "../snackbarMachine";

describe("snackbarMachine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("starts invisible with an empty message", () => {
    expect(snackbarMachine.initialState.matches("invisible")).toBe(true);
    expect(snackbarMachine.initialState.context).toEqual({
      severity: undefined,
      message: undefined,
    });
  });

  test("shows a message with a severity", () => {
    const state = snackbarMachine.transition(snackbarMachine.initialState, {
      type: "SHOW",
      severity: Severities.error,
      message: "Sign in failed",
    } as any);

    expect(state.matches("visible")).toBe(true);
    expect(state.context).toEqual({ severity: "error", message: "Sign in failed" });
  });

  test("clears the message when hidden", () => {
    const visible = snackbarMachine.transition(snackbarMachine.initialState, {
      type: "SHOW",
      severity: Severities.success,
      message: "Saved",
    } as any);
    const hidden = snackbarMachine.transition(visible, "HIDE");

    expect(hidden.matches("invisible")).toBe(true);
    expect(hidden.context).toEqual({ severity: undefined, message: undefined });
  });

  test("auto-hides after three seconds", () => {
    const service = interpret(snackbarMachine).start();

    service.send({ type: "SHOW", severity: Severities.info, message: "Heads up" } as any);
    expect(service.getSnapshot().matches("visible")).toBe(true);

    vi.advanceTimersByTime(2999);
    expect(service.getSnapshot().matches("visible")).toBe(true);

    vi.advanceTimersByTime(1);
    expect(service.getSnapshot().matches("invisible")).toBe(true);
    expect(service.getSnapshot().context.message).toBeUndefined();

    service.stop();
  });
});
