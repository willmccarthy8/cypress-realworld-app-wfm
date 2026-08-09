import { beforeEach, describe, expect, test, vi } from "vitest";
import express from "express";
import request from "supertest";
import shortid from "shortid";

const db = {
  getBankAccountsByUserId: vi.fn(),
  getBankAccountById: vi.fn(),
  createBankAccountForUser: vi.fn(),
  removeBankAccountById: vi.fn(),
  getBankTransfersByUserId: vi.fn(),
  getCommentsByTransactionId: vi.fn(),
  createComments: vi.fn(),
  getLikesByTransactionId: vi.fn(),
  createLikes: vi.fn(),
  getContactsByUsername: vi.fn(),
  createContactForUser: vi.fn(),
  removeContactById: vi.fn(),
  getUnreadNotificationsByUserId: vi.fn(),
  createNotifications: vi.fn(),
  updateNotificationById: vi.fn(),
};

vi.mock("../database", () => db);

const validId = shortid();

const buildApp = async (path: string, modulePath: string) => {
  const router = (await import(modulePath)).default;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
    req.user = { id: "user-1" } as any;
    next();
  });
  app.use(path, router);
  return app;
};

describe("bank account routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /bankAccounts lists the user's accounts", async () => {
    db.getBankAccountsByUserId.mockReturnValue([{ id: "bank-1" }]);
    const app = await buildApp("/bankAccounts", "../bankaccount-routes");

    const response = await request(app).get("/bankAccounts");

    expect(response.status).toEqual(200);
    expect(db.getBankAccountsByUserId).toHaveBeenCalledWith("user-1");
    expect(response.body.results).toEqual([{ id: "bank-1" }]);
  });

  test("GET /bankAccounts/:bankAccountId returns one account", async () => {
    db.getBankAccountById.mockReturnValue({ id: validId });
    const app = await buildApp("/bankAccounts", "../bankaccount-routes");

    const response = await request(app).get(`/bankAccounts/${validId}`);

    expect(response.status).toEqual(200);
    expect(response.body.account).toEqual({ id: validId });
  });

  test("POST /bankAccounts creates an account", async () => {
    db.createBankAccountForUser.mockReturnValue({ id: "bank-1" });
    const app = await buildApp("/bankAccounts", "../bankaccount-routes");
    const payload = {
      bankName: "The Best Bank",
      accountNumber: "123456789",
      routingNumber: "987654321",
    };

    const response = await request(app).post("/bankAccounts").send(payload);

    expect(response.status).toEqual(200);
    expect(db.createBankAccountForUser).toHaveBeenCalledWith("user-1", payload);
  });

  test("POST /bankAccounts rejects a non-string bank name", async () => {
    const app = await buildApp("/bankAccounts", "../bankaccount-routes");

    const response = await request(app).post("/bankAccounts").send({ bankName: 1234 });

    expect(response.status).toEqual(422);
    expect(db.createBankAccountForUser).not.toHaveBeenCalled();
  });

  test("DELETE /bankAccounts/:bankAccountId soft-deletes an account", async () => {
    db.removeBankAccountById.mockReturnValue({ id: validId, isDeleted: true });
    const app = await buildApp("/bankAccounts", "../bankaccount-routes");

    const response = await request(app).delete(`/bankAccounts/${validId}`);

    expect(response.status).toEqual(200);
    expect(db.removeBankAccountById).toHaveBeenCalledWith(validId);
  });
});

describe("bank transfer routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /bankTransfers lists the user's transfers", async () => {
    db.getBankTransfersByUserId.mockReturnValue([{ id: "transfer-1" }]);
    const app = await buildApp("/bankTransfers", "../banktransfer-routes");

    const response = await request(app).get("/bankTransfers");

    expect(response.status).toEqual(200);
    expect(response.body.transfers).toEqual([{ id: "transfer-1" }]);
  });
});

describe("comment routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /comments/:transactionId lists comments", async () => {
    db.getCommentsByTransactionId.mockReturnValue([{ id: "comment-1" }]);
    const app = await buildApp("/comments", "../comment-routes");

    const response = await request(app).get(`/comments/${validId}`);

    expect(response.status).toEqual(200);
    expect(response.body.comments).toEqual([{ id: "comment-1" }]);
  });

  test("POST /comments/:transactionId creates a comment", async () => {
    const app = await buildApp("/comments", "../comment-routes");

    const response = await request(app).post(`/comments/${validId}`).send({ content: "nice" });

    expect(response.status).toEqual(200);
    expect(db.createComments).toHaveBeenCalledWith("user-1", validId, "nice");
  });

  test("POST /comments/:transactionId rejects non-string content", async () => {
    const app = await buildApp("/comments", "../comment-routes");

    const response = await request(app).post(`/comments/${validId}`).send({ content: 42 });

    expect(response.status).toEqual(422);
    expect(db.createComments).not.toHaveBeenCalled();
  });
});

describe("like routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /likes/:transactionId lists likes", async () => {
    db.getLikesByTransactionId.mockReturnValue([{ id: "like-1" }]);
    const app = await buildApp("/likes", "../like-routes");

    const response = await request(app).get(`/likes/${validId}`);

    expect(response.status).toEqual(200);
    expect(response.body.likes).toEqual([{ id: "like-1" }]);
  });

  test("POST /likes/:transactionId creates a like", async () => {
    const app = await buildApp("/likes", "../like-routes");

    const response = await request(app).post(`/likes/${validId}`);

    expect(response.status).toEqual(200);
    expect(db.createLikes).toHaveBeenCalledWith("user-1", validId);
  });

  test("POST /likes/:transactionId rejects an invalid transaction id", async () => {
    const app = await buildApp("/likes", "../like-routes");

    const response = await request(app).post("/likes/not%20an%20id");

    expect(response.status).toEqual(422);
    expect(db.createLikes).not.toHaveBeenCalled();
  });
});

describe("contact routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /contacts/:username lists a user's contacts", async () => {
    db.getContactsByUsername.mockReturnValue([{ id: "contact-1" }]);
    const app = await buildApp("/contacts", "../contact-routes");

    const response = await request(app).get("/contacts/ada");

    expect(response.status).toEqual(200);
    expect(db.getContactsByUsername).toHaveBeenCalledWith("ada");
  });

  test("POST /contacts creates a contact", async () => {
    db.createContactForUser.mockReturnValue({ id: "contact-1" });
    const app = await buildApp("/contacts", "../contact-routes");

    const response = await request(app).post("/contacts").send({ contactUserId: validId });

    expect(response.status).toEqual(200);
    expect(db.createContactForUser).toHaveBeenCalledWith("user-1", validId);
  });

  test("POST /contacts rejects an invalid contact id", async () => {
    const app = await buildApp("/contacts", "../contact-routes");

    const response = await request(app).post("/contacts").send({ contactUserId: "not an id" });

    expect(response.status).toEqual(422);
    expect(db.createContactForUser).not.toHaveBeenCalled();
  });

  test("DELETE /contacts/:contactId removes a contact", async () => {
    db.removeContactById.mockReturnValue([]);
    const app = await buildApp("/contacts", "../contact-routes");

    const response = await request(app).delete(`/contacts/${validId}`);

    expect(response.status).toEqual(200);
    expect(db.removeContactById).toHaveBeenCalledWith(validId);
  });
});

describe("notification routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("GET /notifications lists unread notifications", async () => {
    db.getUnreadNotificationsByUserId.mockReturnValue([{ id: "notification-1" }]);
    const app = await buildApp("/notifications", "../notification-routes");

    const response = await request(app).get("/notifications");

    expect(response.status).toEqual(200);
    expect(response.body.results).toEqual([{ id: "notification-1" }]);
  });

  test("POST /notifications/bulk creates notifications", async () => {
    const items = [{ type: "payment", transactionId: validId }];
    db.createNotifications.mockReturnValue(items);
    const app = await buildApp("/notifications", "../notification-routes");

    const response = await request(app).post("/notifications/bulk").send({ items });

    expect(response.status).toEqual(200);
    expect(db.createNotifications).toHaveBeenCalledWith("user-1", items);
  });

  test("POST /notifications/bulk rejects unknown notification types", async () => {
    const app = await buildApp("/notifications", "../notification-routes");

    const response = await request(app)
      .post("/notifications/bulk")
      .send({ items: [{ type: "bogus", transactionId: validId }] });

    expect(response.status).toEqual(422);
    expect(db.createNotifications).not.toHaveBeenCalled();
  });

  test("PATCH /notifications/:notificationId marks a notification read", async () => {
    const app = await buildApp("/notifications", "../notification-routes");

    const response = await request(app).patch(`/notifications/${validId}`).send({ isRead: true });

    expect(response.status).toEqual(204);
    expect(db.updateNotificationById).toHaveBeenCalledWith("user-1", validId, { isRead: true });
  });

  test("PATCH /notifications/:notificationId rejects a non-boolean isRead", async () => {
    const app = await buildApp("/notifications", "../notification-routes");

    const response = await request(app).patch(`/notifications/${validId}`).send({ isRead: "yes" });

    expect(response.status).toEqual(422);
    expect(db.updateNotificationById).not.toHaveBeenCalled();
  });
});
