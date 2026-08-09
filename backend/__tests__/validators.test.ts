import { describe, expect, test } from "vitest";
import express from "express";
import request from "supertest";
import { validationResult } from "express-validator";
import shortid from "shortid";
import {
  isBankAccountValidator,
  isCommentValidator,
  isNotificationPatchValidator,
  isNotificationsBodyValidator,
  isTransactionPatchValidator,
  isTransactionPayloadValidator,
  isTransactionPublicQSValidator,
  isTransactionQSValidator,
  isUserValidator,
  isValidEntityValidator,
  sanitizeRequestStatus,
  sanitizeTransactionStatus,
  searchValidation,
  shortIdValidation,
  userFieldsValidator,
} from "../validators";

// mounts validations on a throwaway app and reports the resulting errors plus the sanitized request
const validate = (validations: any[]) => {
  const app = express();
  app.use(express.json());
  app.all("/:entity?/:id?", async (req, res) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    res.json({
      errors: validationResult(req).array(),
      query: req.query,
      body: req.body,
    });
  });
  return app;
};

const errorParams = (errors: any[]) => errors.map((error) => error.param);

describe("shortIdValidation", () => {
  test("accepts a valid short id", async () => {
    const app = validate([shortIdValidation("id")]);

    const response = await request(app).get(`/transactions/${shortid()}`);

    expect(response.body.errors).toEqual([]);
  });

  test("rejects an invalid short id", async () => {
    const app = validate([shortIdValidation("id")]);

    const response = await request(app).get("/transactions/not a short id");

    expect(errorParams(response.body.errors)).toEqual(["id"]);
  });
});

describe("searchValidation", () => {
  test("requires a search term", async () => {
    const app = validate([searchValidation]);

    expect((await request(app).get("/users?q=ada")).body.errors).toEqual([]);
    expect(errorParams((await request(app).get("/users")).body.errors)).toEqual(["q"]);
  });
});

describe("userFieldsValidator", () => {
  test("requires at least one editable user field", async () => {
    const app = validate([userFieldsValidator]);

    expect((await request(app).patch("/users").send({ firstName: "Ada" })).body.errors).toEqual([]);
    expect((await request(app).patch("/users").send({ balance: 100 })).body.errors).toEqual([]);
    expect((await request(app).patch("/users").send({ nickname: "Ada" })).body.errors).not.toEqual(
      []
    );
  });
});

describe("isUserValidator", () => {
  test("accepts valid optional user fields", async () => {
    const app = validate(isUserValidator);

    const response = await request(app).patch("/users").send({
      firstName: "Ada",
      email: "ada@example.com",
      balance: 100,
      avatar: "https://example.com/avatar.png",
      defaultPrivacyLevel: "public",
    });

    expect(response.body.errors).toEqual([]);
  });

  test("rejects an invalid avatar and privacy level", async () => {
    const app = validate(isUserValidator);

    const response = await request(app)
      .patch("/users")
      .send({ avatar: "not-a-url", defaultPrivacyLevel: "secret" });

    expect(errorParams(response.body.errors).sort()).toEqual(["avatar", "defaultPrivacyLevel"]);
  });
});

describe("isBankAccountValidator", () => {
  test("requires string bank account fields", async () => {
    const app = validate(isBankAccountValidator);

    const valid = await request(app)
      .post("/bankaccounts")
      .send({ bankName: "The Best Bank", accountNumber: "123456789", routingNumber: "987654321" });
    expect(valid.body.errors).toEqual([]);

    const invalid = await request(app).post("/bankaccounts").send({ bankName: 12345 });
    expect(errorParams(invalid.body.errors)).toContain("bankName");
  });
});

describe("transaction query validators", () => {
  test("accepts a valid transaction query string", async () => {
    const app = validate(isTransactionQSValidator);

    const response = await request(app).get(
      "/transactions?status=complete&requestStatus=pending&amountMin=100&amountMax=200"
    );

    expect(response.body.errors).toEqual([]);
  });

  test("rejects unknown status values", async () => {
    const app = validate(isTransactionQSValidator);

    const response = await request(app).get("/transactions?status=bogus&requestStatus=bogus");

    expect(errorParams(response.body.errors).sort()).toEqual(["requestStatus", "status"]);
  });

  test("only allows the default public ordering", async () => {
    const app = validate(isTransactionPublicQSValidator);

    expect((await request(app).get("/transactions/public?order=default")).body.errors).toEqual([]);
    expect(
      errorParams((await request(app).get("/transactions/public?order=random")).body.errors)
    ).toEqual(["order"]);
  });
});

describe("transaction status sanitizers", () => {
  test("drops unknown status and request status values", async () => {
    const app = validate([sanitizeTransactionStatus, sanitizeRequestStatus]);

    const response = await request(app).get("/transactions?status=bogus&requestStatus=bogus");

    expect(response.body.query.status).toBeUndefined();
    expect(response.body.query.requestStatus).toBeUndefined();
  });
});

describe("isTransactionPayloadValidator", () => {
  test("accepts a valid payment payload and coerces the amount", async () => {
    const app = validate(isTransactionPayloadValidator);

    const response = await request(app).post("/transactions").send({
      transactionType: "payment",
      receiverId: "user-2",
      description: "food",
      amount: "1050",
      privacyLevel: "public",
    });

    expect(response.body.errors).toEqual([]);
    expect(response.body.body.amount).toEqual(1050);
  });

  test("rejects an unknown transaction type and a non-numeric amount", async () => {
    const app = validate(isTransactionPayloadValidator);

    const response = await request(app)
      .post("/transactions")
      .send({ transactionType: "gift", receiverId: "user-2", description: "food", amount: "free" });

    expect(errorParams(response.body.errors).sort()).toEqual(["amount", "transactionType"]);
  });
});

describe("isTransactionPatchValidator", () => {
  test("only accepts known request statuses", async () => {
    const app = validate(isTransactionPatchValidator);

    expect(
      (await request(app).patch("/transactions/1").send({ requestStatus: "accepted" })).body.errors
    ).toEqual([]);
    expect(
      errorParams(
        (await request(app).patch("/transactions/1").send({ requestStatus: "maybe" })).body.errors
      )
    ).toEqual(["requestStatus"]);
  });
});

describe("comment and notification validators", () => {
  test("requires comment content to be a string", async () => {
    const app = validate([isCommentValidator]);

    expect((await request(app).post("/comments").send({ content: "nice" })).body.errors).toEqual(
      []
    );
    expect(
      errorParams((await request(app).post("/comments").send({ content: 42 })).body.errors)
    ).toEqual(["content"]);
  });

  test("validates notification items", async () => {
    const app = validate(isNotificationsBodyValidator);

    const valid = await request(app)
      .post("/notifications")
      .send({ items: [{ type: "payment", transactionId: shortid() }] });
    expect(valid.body.errors).toEqual([]);

    const invalid = await request(app)
      .post("/notifications")
      .send({ items: [{ type: "bogus", transactionId: "nope nope" }] });
    expect(invalid.body.errors.length).toEqual(2);
  });

  test("requires isRead to be a boolean when patching a notification", async () => {
    const app = validate(isNotificationPatchValidator);

    expect(
      (await request(app).patch("/notifications/1").send({ isRead: true })).body.errors
    ).toEqual([]);
    expect(
      errorParams(
        (await request(app).patch("/notifications/1").send({ isRead: "yes" })).body.errors
      )
    ).toEqual(["isRead"]);
  });
});

describe("isValidEntityValidator", () => {
  test("accepts only seedable entities", async () => {
    const app = validate(isValidEntityValidator);

    expect((await request(app).post("/transactions")).body.errors).toEqual([]);
    expect(errorParams((await request(app).post("/robots")).body.errors)).toEqual(["entity"]);
  });
});
