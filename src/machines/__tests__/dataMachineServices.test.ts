import { beforeEach, describe, expect, test, vi } from "vitest";

const httpClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
};

vi.mock("../../utils/asyncUtils", () => ({ httpClient }));

const callService = (machine: any, service: string, event: object, ctx: object = {}) =>
  machine.options.services[service](ctx, event, {} as any);

describe("data machine service configurations", () => {
  beforeEach(() => {
    vi.resetModules();
    httpClient.get.mockReset();
    httpClient.post.mockReset();
    httpClient.patch.mockReset();
  });

  describe("usersMachine", () => {
    test("lists users when no search payload is given", async () => {
      const { usersMachine } = await import("../usersMachine");
      httpClient.get.mockResolvedValue({ data: { results: [] } });

      await callService(usersMachine, "fetchData", { type: "FETCH" });

      expect(httpClient.get).toHaveBeenCalledWith(expect.stringMatching(/\/users$/), {
        params: undefined,
      });
    });

    test("searches users when a payload is given", async () => {
      const { usersMachine } = await import("../usersMachine");
      httpClient.get.mockResolvedValue({ data: { results: [] } });

      await callService(usersMachine, "fetchData", { type: "FETCH", q: "ada" });

      expect(httpClient.get).toHaveBeenCalledWith(expect.stringMatching(/\/users\/search$/), {
        params: { q: "ada" },
      });
    });
  });

  describe("notificationsMachine", () => {
    test("fetches notifications without params for a bare fetch", async () => {
      const { notificationsMachine } = await import("../notificationsMachine");
      httpClient.get.mockResolvedValue({ data: { results: [] } });

      await callService(notificationsMachine, "fetchData", { type: "FETCH" });

      expect(httpClient.get).toHaveBeenCalledWith(expect.stringContaining("/notifications"), {
        params: undefined,
      });
    });

    test("forwards fetch params when present", async () => {
      const { notificationsMachine } = await import("../notificationsMachine");
      httpClient.get.mockResolvedValue({ data: { results: [] } });

      await callService(notificationsMachine, "fetchData", { type: "FETCH", page: 2 });

      expect(httpClient.get).toHaveBeenCalledWith(expect.stringContaining("/notifications"), {
        params: { page: 2 },
      });
    });

    test("patches a notification on update", async () => {
      const { notificationsMachine } = await import("../notificationsMachine");
      httpClient.patch.mockResolvedValue({ data: {} });

      await callService(notificationsMachine, "updateData", {
        type: "UPDATE",
        id: "notification-1",
        isRead: true,
      });

      expect(httpClient.patch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/notification-1"),
        { id: "notification-1", isRead: true }
      );
    });
  });

  describe("transaction list machines", () => {
    const cases: [string, string, RegExp][] = [
      ["personalTransactionsMachine", "../personalTransactionsMachine", /\/transactions$/],
      ["publicTransactionsMachine", "../publicTransactionsMachine", /\/transactions\/public$/],
      [
        "contactsTransactionsMachine",
        "../contactsTransactionsMachine",
        /\/transactions\/contacts$/,
      ],
    ];

    test.each(cases)("%s fetches its transaction feed", async (name, path, urlPattern) => {
      const machine = (await import(path))[name];
      httpClient.get.mockResolvedValue({ data: { results: [] } });

      await callService(machine, "fetchData", { type: "FETCH", page: 1 });

      expect(httpClient.get).toHaveBeenCalledWith(expect.stringMatching(urlPattern), {
        params: { page: 1 },
      });
    });

    test.each(cases)("%s omits params for a bare fetch", async (name, path) => {
      const machine = (await import(path))[name];
      httpClient.get.mockResolvedValue({ data: { results: [] } });

      await callService(machine, "fetchData", { type: "FETCH" });

      expect(httpClient.get).toHaveBeenCalledWith(expect.any(String), { params: undefined });
    });
  });

  describe("transactionDetailMachine", () => {
    test("fetches a transaction by id from the event", async () => {
      const { transactionDetailMachine } = await import("../transactionDetailMachine");
      httpClient.get.mockResolvedValue({ data: { transaction: { id: "transaction-1" } } });

      const result = await callService(transactionDetailMachine, "fetchData", {
        type: "FETCH",
        transactionId: "transaction-1",
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/transactions/transaction-1")
      );
      expect(result).toEqual({ results: [{ id: "transaction-1" }] });
    });

    test("prefers the transaction already in context", async () => {
      const { transactionDetailMachine } = await import("../transactionDetailMachine");
      httpClient.get.mockResolvedValue({ data: { transaction: { id: "from-context" } } });

      await callService(
        transactionDetailMachine,
        "fetchData",
        { type: "FETCH", transactionId: "from-event" },
        { results: [{ id: "from-context" }] }
      );

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/transactions/from-context")
      );
    });

    test("creates likes and comments on their own routes", async () => {
      const { transactionDetailMachine } = await import("../transactionDetailMachine");
      httpClient.post.mockResolvedValue({ data: {} });

      await callService(transactionDetailMachine, "createData", {
        type: "CREATE",
        entity: "LIKE",
        transactionId: "transaction-1",
      });
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/likes/transaction-1"),
        { transactionId: "transaction-1" }
      );

      await callService(transactionDetailMachine, "createData", {
        type: "CREATE",
        entity: "COMMENT",
        transactionId: "transaction-1",
        content: "nice",
      });
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/comments/transaction-1"),
        { transactionId: "transaction-1", content: "nice" }
      );
    });

    test("updates a transaction, preferring the context id", async () => {
      const { transactionDetailMachine } = await import("../transactionDetailMachine");
      httpClient.patch.mockResolvedValue({ data: {} });

      await callService(
        transactionDetailMachine,
        "updateData",
        { type: "UPDATE", id: "from-event", requestStatus: "accepted" },
        { results: [{ id: "from-context" }] }
      );

      expect(httpClient.patch).toHaveBeenCalledWith(
        expect.stringContaining("/transactions/from-context"),
        { id: "from-event", requestStatus: "accepted" }
      );
    });
  });

  describe("bankAccountsMachine", () => {
    test("lists bank accounts through GraphQL", async () => {
      const { bankAccountsMachine } = await import("../bankAccountsMachine");
      httpClient.post.mockResolvedValue({ data: { data: { listBankAccount: [{ id: "1" }] } } });

      const result = await callService(bankAccountsMachine, "fetchData", { type: "FETCH" });

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/graphql"),
        expect.objectContaining({ operationName: "ListBankAccount" })
      );
      expect(result).toEqual({ results: [{ id: "1" }], pageData: {} });
    });

    test("creates a bank account through GraphQL", async () => {
      const { bankAccountsMachine } = await import("../bankAccountsMachine");
      httpClient.post.mockResolvedValue({ data: { data: { createBankAccount: { id: "1" } } } });

      const variables = {
        bankName: "The Best Bank",
        accountNumber: "123456789",
        routingNumber: "987654321",
      };
      await callService(bankAccountsMachine, "createData", { type: "CREATE", ...variables });

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/graphql"),
        expect.objectContaining({ operationName: "CreateBankAccount", variables })
      );
    });

    test("deletes a bank account through GraphQL", async () => {
      const { bankAccountsMachine } = await import("../bankAccountsMachine");
      httpClient.post.mockResolvedValue({ data: { data: { deleteBankAccount: true } } });

      await callService(bankAccountsMachine, "deleteData", { type: "DELETE", id: "1" });

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/graphql"),
        expect.objectContaining({ operationName: "DeleteBankAccount", variables: { id: "1" } })
      );
    });
  });
});
