import { beforeEach, describe, expect, test, vi } from "vitest";
import express from "express";
import paginate from "express-paginate";
import request from "supertest";

const db = {
  getTransactionsForUserForApi: vi.fn(),
  getTransactionsForUserContacts: vi.fn(),
  getPublicTransactionsByQuery: vi.fn(),
  getPublicTransactionsDefaultSort: vi.fn(),
  getTransactionByIdForApi: vi.fn(),
  createTransaction: vi.fn(),
  updateTransactionById: vi.fn(),
};

vi.mock("../database", () => db);

const transaction = (id: string) => ({ id, amount: 100, description: "food" });

const buildApp = async () => {
  const router = (await import("../transaction-routes")).default;
  const app = express();
  app.use(express.json());
  app.use(paginate.middleware(10));
  app.use((req, _res, next) => {
    req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
    req.user = { id: "user-1" } as any;
    next();
  });
  app.use("/transactions", router);
  return app;
};

describe("transaction routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /transactions returns the current user's paginated transactions", async () => {
    db.getTransactionsForUserForApi.mockReturnValue([transaction("1"), transaction("2")]);
    const app = await buildApp();

    const response = await request(app).get("/transactions?page=1&limit=1");

    expect(response.status).toEqual(200);
    expect(db.getTransactionsForUserForApi).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ page: 1, limit: 1 })
    );
    expect(response.body.results).toEqual([transaction("1")]);
    expect(response.body.pageData).toMatchObject({ page: 1, limit: 1, totalPages: 2 });
  });

  test("GET /transactions/contacts returns contact transactions", async () => {
    db.getTransactionsForUserContacts.mockReturnValue([transaction("1")]);
    const app = await buildApp();

    const response = await request(app).get("/transactions/contacts?page=1&limit=10");

    expect(response.status).toEqual(200);
    expect(db.getTransactionsForUserContacts).toHaveBeenCalledWith("user-1", expect.any(Object));
    expect(response.body.results).toEqual([transaction("1")]);
  });

  test("GET /transactions/public prepends up to five contact transactions on the first page", async () => {
    const contactsTransactions = ["c1", "c2", "c3", "c4", "c5", "c6"].map(transaction);
    db.getPublicTransactionsByQuery.mockReturnValue({
      contactsTransactions,
      publicTransactions: [transaction("p1")],
    });
    const app = await buildApp();

    const response = await request(app).get("/transactions/public?page=1&limit=10");

    expect(response.status).toEqual(200);
    expect(response.body.results.map((tx: any) => tx.id)).toEqual([
      "c1",
      "c2",
      "c3",
      "c4",
      "c5",
      "p1",
    ]);
  });

  test("GET /transactions/public returns only public transactions past the first page", async () => {
    db.getPublicTransactionsByQuery.mockReturnValue({
      contactsTransactions: [transaction("c1")],
      publicTransactions: [transaction("p1")],
    });
    const app = await buildApp();

    const response = await request(app).get("/transactions/public?page=2&limit=1");

    expect(response.body.results).toEqual([]);
    expect(response.body.pageData).toMatchObject({ page: 2, totalPages: 1 });
  });

  test("GET /transactions/public rejects an unknown ordering", async () => {
    const app = await buildApp();

    const response = await request(app).get("/transactions/public?order=random");

    expect(response.status).toEqual(422);
    expect(db.getPublicTransactionsByQuery).not.toHaveBeenCalled();
  });

  test("POST /transactions creates a transaction for the current user", async () => {
    db.createTransaction.mockReturnValue(transaction("1"));
    const app = await buildApp();

    const response = await request(app).post("/transactions").send({
      transactionType: "payment",
      receiverId: "user-2",
      description: "food",
      amount: 100,
    });

    expect(response.status).toEqual(200);
    expect(db.createTransaction).toHaveBeenCalledWith(
      "user-1",
      "payment",
      expect.objectContaining({ receiverId: "user-2", amount: 100 })
    );
    expect(response.body).toEqual({ transaction: transaction("1") });
  });

  test("POST /transactions rejects an invalid payload", async () => {
    const app = await buildApp();

    const response = await request(app).post("/transactions").send({ transactionType: "gift" });

    expect(response.status).toEqual(422);
    expect(db.createTransaction).not.toHaveBeenCalled();
  });

  test("GET /transactions/:transactionId returns a single transaction", async () => {
    db.getTransactionByIdForApi.mockReturnValue(transaction("aBcD1234"));
    const app = await buildApp();

    const response = await request(app).get("/transactions/aBcD1234");

    expect(response.status).toEqual(200);
    expect(db.getTransactionByIdForApi).toHaveBeenCalledWith("aBcD1234");
    expect(response.body.transaction).toEqual(transaction("aBcD1234"));
  });

  test("GET /transactions/:transactionId rejects an invalid id", async () => {
    const app = await buildApp();

    const response = await request(app).get("/transactions/not%20an%20id");

    expect(response.status).toEqual(422);
    expect(db.getTransactionByIdForApi).not.toHaveBeenCalled();
  });

  test("PATCH /transactions/:transactionId updates the request status", async () => {
    const app = await buildApp();

    const response = await request(app)
      .patch("/transactions/aBcD1234")
      .send({ requestStatus: "accepted" });

    expect(response.status).toEqual(204);
    expect(db.updateTransactionById).toHaveBeenCalledWith("aBcD1234", {
      requestStatus: "accepted",
    });
  });

  test("PATCH /transactions/:transactionId rejects an unknown request status", async () => {
    const app = await buildApp();

    const response = await request(app)
      .patch("/transactions/aBcD1234")
      .send({ requestStatus: "maybe" });

    expect(response.status).toEqual(422);
    expect(db.updateTransactionById).not.toHaveBeenCalled();
  });
});
