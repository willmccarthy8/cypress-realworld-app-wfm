import { beforeEach, describe, expect, test, vi } from "vitest";
import express from "express";
import request from "supertest";

const db = {
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  getUserById: vi.fn(),
  getUserByUsername: vi.fn(),
  searchUsers: vi.fn(),
  removeUserFromResults: vi.fn(),
};

vi.mock("../database", () => db);

const user = (overrides: object = {}) => ({
  id: "aBcD1234",
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
  avatar: "https://example.com/avatar.png",
  ...overrides,
});

const buildApp = async (currentUserId = "aBcD1234") => {
  const router = (await import("../user-routes")).default;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
    req.user = { id: currentUserId } as any;
    next();
  });
  app.use("/users", router);
  return app;
};

describe("user routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
    db.removeUserFromResults.mockImplementation((_id: string, users: any[]) => users);
  });

  test("GET /users lists other users", async () => {
    db.getAllUsers.mockReturnValue([user(), user({ id: "other" })]);
    const app = await buildApp();

    const response = await request(app).get("/users");

    expect(response.status).toEqual(200);
    expect(db.removeUserFromResults).toHaveBeenCalledWith("aBcD1234", expect.any(Array));
    expect(response.body.results).toHaveLength(2);
  });

  test("GET /users/search searches by term", async () => {
    db.searchUsers.mockReturnValue([user()]);
    const app = await buildApp();

    const response = await request(app).get("/users/search?q=ada");

    expect(response.status).toEqual(200);
    expect(db.searchUsers).toHaveBeenCalledWith("ada");
    expect(response.body.results).toHaveLength(1);
  });

  test("GET /users/search requires a search term", async () => {
    const app = await buildApp();

    const response = await request(app).get("/users/search");

    expect(response.status).toEqual(422);
    expect(db.searchUsers).not.toHaveBeenCalled();
  });

  test("POST /users creates a user", async () => {
    db.createUser.mockReturnValue(user());
    const app = await buildApp();

    const response = await request(app)
      .post("/users")
      .send({ firstName: "Ada", lastName: "Lovelace", username: "ada", password: "s3cret" });

    expect(response.status).toEqual(201);
    expect(db.createUser).toHaveBeenCalledWith(expect.objectContaining({ username: "ada" }));
    expect(response.body.user).toEqual(user());
  });

  test("POST /users rejects a payload without any user fields", async () => {
    const app = await buildApp();

    const response = await request(app).post("/users").send({ nickname: "Ada" });

    expect(response.status).toEqual(422);
    expect(db.createUser).not.toHaveBeenCalled();
  });

  test("GET /users/:userId returns the account owner", async () => {
    db.getUserById.mockReturnValue(user());
    const app = await buildApp();

    const response = await request(app).get("/users/aBcD1234");

    expect(response.status).toEqual(200);
    expect(response.body.user).toEqual(user());
  });

  test("GET /users/:userId rejects a request for another user", async () => {
    const app = await buildApp("someone-else");

    const response = await request(app).get("/users/aBcD1234");

    expect(response.status).toEqual(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(db.getUserById).not.toHaveBeenCalled();
  });

  test("GET /users/:userId rejects an invalid id", async () => {
    const app = await buildApp();

    const response = await request(app).get("/users/not%20an%20id");

    expect(response.status).toEqual(422);
  });

  test("GET /users/profile/:username exposes only public profile fields", async () => {
    db.getUserByUsername.mockReturnValue(user({ password: "s3cret", email: "ada@example.com" }));
    const app = await buildApp();

    const response = await request(app).get("/users/profile/ada");

    expect(response.status).toEqual(200);
    expect(response.body.user).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      avatar: "https://example.com/avatar.png",
    });
  });

  test("PATCH /users/:userId updates the user", async () => {
    const app = await buildApp();

    const response = await request(app).patch("/users/aBcD1234").send({ firstName: "Grace" });

    expect(response.status).toEqual(204);
    expect(db.updateUserById).toHaveBeenCalledWith("aBcD1234", { firstName: "Grace" });
  });

  test("PATCH /users/:userId rejects invalid edits", async () => {
    const app = await buildApp();

    const response = await request(app).patch("/users/aBcD1234").send({ avatar: "not-a-url" });

    expect(response.status).toEqual(422);
    expect(db.updateUserById).not.toHaveBeenCalled();
  });
});
