import { describe, expect, test } from "vitest";
import { transactionFiltersMachine } from "../transactionFiltersMachine";

const dateFilter = {
  type: "DATE_FILTER" as const,
  dateRangeStart: "2019-12-01T00:00:00.000Z",
  dateRangeEnd: "2019-12-05T00:00:00.000Z",
};

const amountFilter = { type: "AMOUNT_FILTER" as const, amountMin: "10", amountMax: "50" };

describe("transactionFiltersMachine", () => {
  test("starts with both filters unset", () => {
    const { initialState } = transactionFiltersMachine;

    expect(initialState.matches({ dateRange: "none" })).toBe(true);
    expect(initialState.matches({ amountRange: "none" })).toBe(true);
    expect(initialState.context).toMatchObject({
      dateRangeStart: undefined,
      dateRangeEnd: undefined,
      amountMin: undefined,
      amountMax: undefined,
    });
  });

  test("applies and resets the date range filter", () => {
    let state = transactionFiltersMachine.transition(
      transactionFiltersMachine.initialState,
      dateFilter
    );

    expect(state.matches({ dateRange: "filter" })).toBe(true);
    expect(state.context).toMatchObject({
      dateRangeStart: dateFilter.dateRangeStart,
      dateRangeEnd: dateFilter.dateRangeEnd,
    });

    state = transactionFiltersMachine.transition(state, "DATE_RESET");

    expect(state.matches({ dateRange: "none" })).toBe(true);
    expect(state.context).toMatchObject({ dateRangeStart: undefined, dateRangeEnd: undefined });
  });

  test("applies and resets the amount range filter", () => {
    let state = transactionFiltersMachine.transition(
      transactionFiltersMachine.initialState,
      amountFilter
    );

    expect(state.matches({ amountRange: "filter" })).toBe(true);
    expect(state.context).toMatchObject({ amountMin: "10", amountMax: "50" });

    state = transactionFiltersMachine.transition(state, "AMOUNT_RESET");

    expect(state.matches({ amountRange: "none" })).toBe(true);
    expect(state.context).toMatchObject({ amountMin: undefined, amountMax: undefined });
  });

  test("re-applies an amount filter while already filtering", () => {
    const filtering = transactionFiltersMachine.transition(
      transactionFiltersMachine.initialState,
      amountFilter
    );
    const state = transactionFiltersMachine.transition(filtering, {
      ...amountFilter,
      amountMax: "80",
    });

    expect(state.matches({ amountRange: "filter" })).toBe(true);
    expect(state.context).toMatchObject({ amountMin: "10", amountMax: "80" });
  });

  test("keeps the date and amount filters independent", () => {
    const withDate = transactionFiltersMachine.transition(
      transactionFiltersMachine.initialState,
      dateFilter
    );
    const withBoth = transactionFiltersMachine.transition(withDate, amountFilter);

    expect(withBoth.matches({ dateRange: "filter" })).toBe(true);
    expect(withBoth.matches({ amountRange: "filter" })).toBe(true);

    const amountReset = transactionFiltersMachine.transition(withBoth, "AMOUNT_RESET");

    expect(amountReset.matches({ dateRange: "filter" })).toBe(true);
    expect(amountReset.context).toMatchObject({ dateRangeStart: dateFilter.dateRangeStart });
  });
});
