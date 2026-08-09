import { beforeEach, describe, expect, test, vi } from "vitest";

const db = {
  createBankAccountForUser: vi.fn(),
  removeBankAccountById: vi.fn(),
  getBankAccountsByUserId: vi.fn(),
};

vi.mock("../database", () => db);

const ctx = { user: { id: "user-1" } };

describe("graphql resolvers", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(db).forEach((mock) => mock.mockReset());
  });

  test("exposes the Query and Mutation resolver maps", async () => {
    const resolvers = (await import("../graphql/resolvers")).default;

    expect(Object.keys(resolvers.Query)).toEqual(["listBankAccount"]);
    expect(Object.keys(resolvers.Mutation).sort()).toEqual([
      "createBankAccount",
      "deleteBankAccount",
    ]);
  });

  test("listBankAccount returns the current user's accounts", async () => {
    const resolvers = (await import("../graphql/resolvers")).default;
    const accounts = [{ id: "bank-1" }];
    db.getBankAccountsByUserId.mockReturnValue(accounts);

    expect(resolvers.Query.listBankAccount({}, {}, ctx)).toEqual(accounts);
    expect(db.getBankAccountsByUserId).toHaveBeenCalledWith("user-1");
  });

  test("createBankAccount creates an account for the current user", async () => {
    const resolvers = (await import("../graphql/resolvers")).default;
    const args = {
      bankName: "The Best Bank",
      accountNumber: "123456789",
      routingNumber: "987654321",
    };
    db.createBankAccountForUser.mockReturnValue({ id: "bank-1", ...args });

    expect(resolvers.Mutation.createBankAccount({}, args, ctx)).toMatchObject(args);
    expect(db.createBankAccountForUser).toHaveBeenCalledWith("user-1", args);
  });

  test("deleteBankAccount soft-deletes the account and reports success", async () => {
    const resolvers = (await import("../graphql/resolvers")).default;

    expect(resolvers.Mutation.deleteBankAccount({}, { id: "bank-1" }, ctx)).toBe(true);
    expect(db.removeBankAccountById).toHaveBeenCalledWith("bank-1");
  });
});
