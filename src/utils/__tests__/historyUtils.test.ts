import { describe, expect, test } from "vitest";
import { history } from "../historyUtils";

describe("History Utils", () => {
  test("exports a browser history instance", () => {
    expect(typeof history.push).toEqual("function");
    expect(typeof history.replace).toEqual("function");
    expect(typeof history.listen).toEqual("function");
  });

  test("navigates and notifies listeners", () => {
    const visited: string[] = [];
    const unlisten = history.listen((location) => visited.push(location.pathname));

    history.push("/transaction/new");
    history.push("/bankaccounts");

    expect(visited).toEqual(["/transaction/new", "/bankaccounts"]);
    expect(history.location.pathname).toEqual("/bankaccounts");

    unlisten();
    history.push("/");

    expect(visited).toEqual(["/transaction/new", "/bankaccounts"]);
  });
});
