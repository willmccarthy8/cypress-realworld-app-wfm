import { describe, expect, test, vi } from "vitest";
import express from "express";
import request from "supertest";
import { check } from "express-validator";
import { ensureAuthenticated, validateMiddleware } from "../helpers";

const appWith = (middleware: express.RequestHandler, beforeMiddleware?: express.RequestHandler) => {
  const app = express();
  app.use(express.json());
  if (beforeMiddleware) app.use(beforeMiddleware);
  app.post("/", middleware, (req, res) => {
    res.status(200).json({ user: req.user, body: req.body });
  });
  return app;
};

describe("ensureAuthenticated", () => {
  test("continues when the request is authenticated", async () => {
    const app = appWith(ensureAuthenticated, (req, _res, next) => {
      req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
      req.user = { id: "user-1" } as any;
      next();
    });

    const response = await request(app).post("/").send({});

    expect(response.status).toEqual(200);
    expect(response.body.user).toEqual({ id: "user-1" });
  });

  test("maps a provider sub claim onto the user id", async () => {
    const app = appWith(ensureAuthenticated, (req, _res, next) => {
      req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
      req.user = { sub: "auth0|123" } as any;
      next();
    });

    const response = await request(app).post("/").send({});

    expect(response.body.user).toMatchObject({ sub: "auth0|123", id: "auth0|123" });
  });

  test("responds with 401 when the request is not authenticated", async () => {
    const app = appWith(ensureAuthenticated, (req, _res, next) => {
      req.isAuthenticated = (() => false) as typeof req.isAuthenticated;
      next();
    });

    const response = await request(app).post("/").send({});

    expect(response.status).toEqual(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});

describe("validateMiddleware", () => {
  test("runs every validation and continues when they pass", async () => {
    const validation = check("amount").isNumeric();
    const runSpy = vi.spyOn(validation, "run");
    const app = appWith(validateMiddleware([validation]));

    const response = await request(app).post("/").send({ amount: 100 });

    expect(response.status).toEqual(200);
    expect(runSpy).toHaveBeenCalled();
  });

  test("responds with 422 and the validation errors when they fail", async () => {
    const app = appWith(validateMiddleware([check("amount").isNumeric()]));

    const response = await request(app).post("/").send({ amount: "not-a-number" });

    expect(response.status).toEqual(422);
    expect(response.body.errors).toEqual([
      expect.objectContaining({ param: "amount", value: "not-a-number" }),
    ]);
  });
});
