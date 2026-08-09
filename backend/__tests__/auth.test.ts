import { beforeEach, describe, expect, test, vi } from "vitest";
import bcrypt from "bcryptjs";
import express from "express";
import passport from "passport";
import request from "supertest";

const db = {
  getUserBy: vi.fn(),
  getUserById: vi.fn(),
};

vi.mock("../database", () => db);

const password = "s3cret";
const storedUser = {
  id: "aBcD1234",
  username: "ada",
  password: bcrypt.hashSync(password, 10),
};

const importRouter = async () => (await import("../auth")).default;

const buildApp = async (currentUser?: object) => {
  const router = await importRouter();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = currentUser as any;
    req.session = { cookie: {}, destroy: (cb: Function) => cb() } as any;
    req.logout = ((cb: Function) => cb()) as any;
    next();
  });
  app.use(router);
  return app;
};

const localStrategyVerify = async () => {
  await importRouter();
  const strategy: any = (passport as any)._strategy("local");
  return strategy._verify;
};

describe("auth", () => {
  beforeEach(() => {
    vi.resetModules();
    db.getUserBy.mockReset();
    db.getUserById.mockReset();
  });

  test("verifies a user with valid credentials", async () => {
    db.getUserBy.mockReturnValue(storedUser);
    const verify = await localStrategyVerify();
    const done = vi.fn();

    verify("ada", password, done);

    expect(db.getUserBy).toHaveBeenCalledWith("username", "ada");
    expect(done).toHaveBeenCalledWith(null, storedUser);
  });

  test("rejects an unknown username", async () => {
    db.getUserBy.mockReturnValue(undefined);
    const verify = await localStrategyVerify();
    const done = vi.fn();

    verify("nobody", password, done);

    expect(done).toHaveBeenCalledWith(null, false, {
      message: "Incorrect username or password.",
    });
  });

  test("rejects an incorrect password", async () => {
    db.getUserBy.mockReturnValue(storedUser);
    const verify = await localStrategyVerify();
    const done = vi.fn();

    verify("ada", "wrong-password", done);

    expect(done).toHaveBeenCalledWith(null, false, {
      message: "Incorrect username or password.",
    });
  });

  test("serializes a user to its id and deserializes it back", async () => {
    db.getUserById.mockReturnValue(storedUser);
    await importRouter();
    const serialize = vi.fn();
    const deserialize = vi.fn();

    (passport as any).serializeUser(storedUser, serialize);
    (passport as any).deserializeUser(storedUser.id, deserialize);

    expect(serialize).toHaveBeenCalledWith(null, storedUser.id);
    expect(deserialize).toHaveBeenCalledWith(null, storedUser);
    expect(db.getUserById).toHaveBeenCalledWith(storedUser.id);
  });

  test("GET /checkAuth returns the signed-in user", async () => {
    const app = await buildApp({ id: "aBcD1234" });

    const response = await request(app).get("/checkAuth");

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ user: { id: "aBcD1234" } });
  });

  test("GET /checkAuth rejects an anonymous request", async () => {
    const app = await buildApp();

    const response = await request(app).get("/checkAuth");

    expect(response.status).toEqual(401);
    expect(response.body).toEqual({ error: "User is unauthorized" });
  });

  test("POST /logout clears the session cookie and redirects", async () => {
    const app = await buildApp({ id: "aBcD1234" });

    const response = await request(app).post("/logout");

    expect(response.status).toEqual(302);
    expect(response.headers.location).toEqual("/");
    expect(response.headers["set-cookie"].join()).toContain("connect.sid=;");
  });

  test("POST /login extends the cookie lifetime when remembering the user", async () => {
    db.getUserBy.mockReturnValue(storedUser);
    const router = await importRouter();
    const cookie: Record<string, unknown> = {};
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.session = { cookie } as any;
      req.logIn = ((user: object, _options: object, cb: Function) => {
        req.user = user as any;
        cb();
      }) as any;
      next();
    });
    app.use(router);

    const response = await request(app)
      .post("/login")
      .send({ username: "ada", password, remember: true });

    expect(response.status).toEqual(200);
    expect(response.body.user).toMatchObject({ id: storedUser.id });
    expect(cookie.maxAge).toEqual(24 * 60 * 60 * 1000 * 30);
  });

  test("POST /login rejects invalid credentials", async () => {
    db.getUserBy.mockReturnValue(storedUser);
    const router = await importRouter();
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.session = { cookie: {} } as any;
      req.logIn = ((user: object, _options: object, cb: Function) => cb()) as any;
      next();
    });
    app.use(router);

    const response = await request(app)
      .post("/login")
      .send({ username: "ada", password: "wrong-password" });

    expect(response.status).toEqual(401);
  });
});
