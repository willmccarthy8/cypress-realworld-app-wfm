import { beforeEach, describe, expect, test, vi } from "vitest";
import { interpret } from "xstate";

const httpClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
};

const authService = { send: vi.fn() };

vi.mock("../../utils/asyncUtils", () => ({ httpClient }));
vi.mock("../authMachine", () => ({ authService }));

const importMachine = async () => {
  const { createTransactionMachine } = await import("../createTransactionMachine");
  return createTransactionMachine;
};

// the machine ships without an initial context, so tests seed an empty one before asserting on it
const importMachineWithContext = async () => (await importMachine()).withContext({} as any);

const sender = { id: "user-1" };
const receiver = { id: "user-2" };

describe("createTransactionMachine", () => {
  beforeEach(() => {
    vi.resetModules();
    httpClient.post.mockReset();
    authService.send.mockReset();
  });

  test("starts on the first step with a cleared context", async () => {
    const machine = await importMachineWithContext();

    expect(machine.initialState.matches("stepOne")).toBe(true);
    expect(machine.initialState.context).toEqual({});
  });

  test("stores sender and receiver when moving to step two", async () => {
    const machine = await importMachineWithContext();
    const state = machine.transition(machine.initialState, {
      type: "SET_USERS",
      sender,
      receiver,
    } as any);

    expect(state.matches("stepTwo")).toBe(true);
    expect(state.context).toMatchObject({ sender, receiver });
  });

  test("stores the transaction details when moving to step three", async () => {
    const machine = await importMachineWithContext();
    const stepTwo = machine.transition(machine.initialState, {
      type: "SET_USERS",
      sender,
      receiver,
    } as any);
    const event = { type: "CREATE", amount: 25, description: "food" };
    const stepThree = machine.transition(stepTwo, event as any);

    expect(stepThree.matches("stepThree")).toBe(true);
    expect(stepThree.context.transactionDetails).toMatchObject(event);
  });

  test("returns to the first step on reset", async () => {
    const machine = await importMachineWithContext();
    const service = interpret(machine).start();

    service.send({ type: "SET_USERS", sender, receiver } as any);
    service.send({ type: "CREATE", amount: 25 } as any);
    expect(service.getSnapshot().matches("stepThree")).toBe(true);

    service.send("RESET");

    expect(service.getSnapshot().matches("stepOne")).toBe(true);
    service.stop();
  });

  test("overwrites the previous users when starting a new transaction", async () => {
    const machine = await importMachineWithContext();
    const service = interpret(machine).start();

    service.send({ type: "SET_USERS", sender, receiver } as any);
    service.send({ type: "CREATE", amount: 25 } as any);
    service.send("RESET");
    service.send({ type: "SET_USERS", sender: receiver, receiver: sender } as any);

    expect(service.getSnapshot().context).toMatchObject({ sender: receiver, receiver: sender });
    service.stop();
  });

  test("ignores CREATE before the users are set", async () => {
    const machine = await importMachine();
    const state = machine.transition("stepOne", { type: "CREATE" } as any);

    expect(state.matches("stepOne")).toBe(true);
  });

  test("posts the transaction and refreshes the authenticated user", async () => {
    const machine = await importMachine();
    httpClient.post.mockResolvedValue({ data: { transaction: { id: "transaction-1" } } });

    const service = interpret(machine).start();
    service.send({ type: "SET_USERS", sender, receiver } as any);
    service.send({ type: "CREATE", amount: 25, description: "food" } as any);

    await vi.waitFor(() => expect(authService.send).toHaveBeenCalledWith("REFRESH"));

    expect(httpClient.post).toHaveBeenCalledWith(expect.stringContaining("/transactions"), {
      amount: 25,
      description: "food",
    });
    service.stop();
  });
});
