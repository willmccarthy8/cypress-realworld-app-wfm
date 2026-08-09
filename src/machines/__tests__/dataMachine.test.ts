import { describe, expect, test, vi } from "vitest";
import { interpret } from "xstate";
import { dataMachine } from "../dataMachine";

const machine = dataMachine("test");

describe("dataMachine", () => {
  test("starts idle with empty context", () => {
    expect(machine.initialState.matches("idle")).toBe(true);
    expect(machine.initialState.context).toEqual({
      pageData: {},
      results: [],
      message: undefined,
    });
  });

  test("transitions from idle for each data event", () => {
    expect(machine.transition("idle", "FETCH").matches("loading")).toBe(true);
    expect(machine.transition("idle", "CREATE").matches("creating")).toBe(true);
    expect(machine.transition("idle", "UPDATE").matches("updating")).toBe(true);
    expect(machine.transition("idle", "DELETE").matches("deleting")).toBe(true);
  });

  test("ignores unknown events", () => {
    const state = machine.transition("idle", "SUCCESS" as any);

    expect(state.matches("idle")).toBe(true);
    expect(state.changed).toBeFalsy();
  });

  test("moves to success with data after a successful fetch", async () => {
    const fetchData = vi.fn().mockResolvedValue({
      results: [{ id: "1" }],
      pageData: { page: 1, totalPages: 1 },
    });
    const service = interpret(machine.withConfig({ services: { fetchData } })).start();

    service.send("FETCH");
    await vi.waitFor(() => expect(service.getSnapshot().matches("success.withData")).toBe(true));

    expect(service.getSnapshot().context.results).toEqual([{ id: "1" }]);
    expect(service.getSnapshot().context.pageData).toEqual({ page: 1, totalPages: 1 });
    service.stop();
  });

  test("moves to success without data when the fetch returns nothing", async () => {
    const fetchData = vi.fn().mockResolvedValue({ results: [], pageData: {} });
    const service = interpret(machine.withConfig({ services: { fetchData } })).start();

    service.send("FETCH");
    await vi.waitFor(() => expect(service.getSnapshot().matches("success.withoutData")).toBe(true));

    expect(service.getSnapshot().context.results).toEqual([]);
    service.stop();
  });

  test("appends results when paging past the first page", async () => {
    const fetchData = vi
      .fn()
      .mockResolvedValueOnce({ results: [{ id: "1" }], pageData: { page: 1 } })
      .mockResolvedValueOnce({ results: [{ id: "2" }], pageData: { page: 2 } });
    const service = interpret(machine.withConfig({ services: { fetchData } })).start();

    service.send("FETCH");
    await vi.waitFor(() => expect(service.getSnapshot().matches("success.withData")).toBe(true));

    service.send({ type: "FETCH", page: 2 } as any);
    await vi.waitFor(() =>
      expect(service.getSnapshot().context.results).toEqual([{ id: "1" }, { id: "2" }])
    );

    service.stop();
  });

  test("reloads data after create, update and delete", async () => {
    const fetchData = vi.fn().mockResolvedValue({ results: [{ id: "1" }], pageData: {} });
    const createData = vi.fn().mockResolvedValue({});
    const updateData = vi.fn().mockResolvedValue({});
    const deleteData = vi.fn().mockResolvedValue({});
    const service = interpret(
      machine.withConfig({ services: { fetchData, createData, updateData, deleteData } })
    ).start();

    for (const event of ["CREATE", "UPDATE", "DELETE"]) {
      service.send(event);
      await vi.waitFor(() => expect(service.getSnapshot().matches("success")).toBe(true));
    }

    expect(createData).toHaveBeenCalled();
    expect(updateData).toHaveBeenCalled();
    expect(deleteData).toHaveBeenCalled();
    expect(fetchData).toHaveBeenCalledTimes(3);
    service.stop();
  });

  test("moves to failure when fetching rejects and can retry", async () => {
    const fetchData = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ results: [{ id: "1" }], pageData: {} });
    const service = interpret(machine.withConfig({ services: { fetchData } })).start();

    service.send("FETCH");
    await vi.waitFor(() => expect(service.getSnapshot().matches("failure")).toBe(true));

    service.send("FETCH");
    await vi.waitFor(() => expect(service.getSnapshot().matches("success.withData")).toBe(true));

    service.stop();
  });
});
