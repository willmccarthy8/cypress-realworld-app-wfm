import { describe, expect, test } from "vitest";
import { toSnapshot } from "dinero.js";
import {
  amountRangeValueText,
  endOfDayUTC,
  formatAmount,
  formatAmountRangeValues,
  formatAmountSlider,
  formatFullName,
  getAmountQueryFields,
  getChargeAmount,
  getDateQueryFields,
  getPaginatedItems,
  getPayAppCreditedAmount,
  getTransferAmount,
  hasAmountQueryFields,
  hasDateQueryFields,
  hasPaginationQueryFields,
  hasSufficientFunds,
  isAcceptedRequestTransaction,
  isCommentNotification,
  isLikeNotification,
  isPayment,
  isPaymentNotification,
  isPaymentReceivedNotification,
  isPaymentRequestedNotification,
  isPendingRequestTransaction,
  isRejectedRequestTransaction,
  isoStringToLocalDateFull,
  isoStringToLocalMidnightEnd,
  isoStringToLocalMidnightStart,
  localDateToIsoString,
  localDateToUTCISOString,
  omitAmountQueryFields,
  omitDateQueryFields,
  omitPaginationQueryFields,
  padAmountWithZeros,
  payAppAddition,
  payAppDifference,
  receiverIsCurrentUser,
  startOfDayUTC,
} from "../transactionUtils";
import {
  CommentNotification,
  DefaultPrivacyLevel,
  LikeNotification,
  NotificationType,
  PaymentNotification,
  PaymentNotificationStatus,
  Transaction,
  TransactionRequestStatus,
  TransactionStatus,
  User,
} from "../../models";

const user = (overrides: Partial<User> = {}): User =>
  ({
    id: "user-1",
    uuid: "3ea67c02-4a2e-4c65-a1f2-5b0dc4a6d3f5",
    firstName: "Ada",
    lastName: "Lovelace",
    username: "ada",
    password: "password",
    email: "ada@example.com",
    phoneNumber: "555-555-5555",
    avatar: "/avatar.png",
    defaultPrivacyLevel: DefaultPrivacyLevel.public,
    balance: 10_000,
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
    modifiedAt: new Date("2020-01-02T00:00:00.000Z"),
    ...overrides,
  }) as User;

const transaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: "transaction-1",
    uuid: "0f1a1cb1-cf6a-4a29-9f65-6a2e0b8a5e2b",
    source: "source-1",
    amount: 2_500,
    description: "food",
    privacyLevel: DefaultPrivacyLevel.public,
    receiverId: "user-2",
    senderId: "user-1",
    balanceAtCompletion: 7_500,
    status: TransactionStatus.pending,
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
    modifiedAt: new Date("2020-01-02T00:00:00.000Z"),
    ...overrides,
  }) as Transaction;

describe("request status predicates", () => {
  test("identifies pending, accepted and rejected requests", () => {
    const pending = transaction({ requestStatus: TransactionRequestStatus.pending });
    const accepted = transaction({ requestStatus: TransactionRequestStatus.accepted });
    const rejected = transaction({ requestStatus: TransactionRequestStatus.rejected });

    expect(isPendingRequestTransaction(pending)).toBe(true);
    expect(isPendingRequestTransaction(accepted)).toBe(false);
    expect(isAcceptedRequestTransaction(accepted)).toBe(true);
    expect(isAcceptedRequestTransaction(rejected)).toBe(false);
    expect(isRejectedRequestTransaction(rejected)).toBe(true);
    expect(isRejectedRequestTransaction(pending)).toBe(false);
  });

  test("identifies payments as transactions without a request status", () => {
    expect(isPayment(transaction())).toBe(true);
    expect(isPayment(transaction({ requestStatus: TransactionRequestStatus.pending }))).toBe(false);
  });

  test("checks whether the receiver is the current user", () => {
    const currentUser = user({ id: "user-2" });

    expect(receiverIsCurrentUser(currentUser, transaction())).toBe(true);
    expect(receiverIsCurrentUser(user(), transaction())).toBe(false);
  });
});

describe("amount formatting and math", () => {
  test("formats amounts as USD", () => {
    expect(formatAmount(150_000)).toEqual("$1,500.00");
    expect(formatAmountSlider(150_000)).toEqual("$1,500");
  });

  test("pads amounts with zeros and formats slider ranges", () => {
    expect(padAmountWithZeros(1.5)).toEqual(1500);
    expect(amountRangeValueText(1)).toEqual("$10.00");
    expect(formatAmountRangeValues([1, 5])).toEqual("$10 - $50");
  });

  test("subtracts and adds transaction amounts against a balance", () => {
    const sender = user({ balance: 10_000 });
    const tx = transaction({ amount: 2_500 });

    expect(toSnapshot(payAppDifference(sender, tx)).amount).toEqual(7_500);
    expect(toSnapshot(payAppAddition(sender, tx)).amount).toEqual(12_500);
    expect(getChargeAmount(sender, tx)).toEqual(7_500);
    expect(getTransferAmount(sender, tx)).toEqual(7_500);
    expect(getPayAppCreditedAmount(sender, tx)).toEqual(12_500);
  });

  test("determines whether the sender has sufficient funds", () => {
    expect(hasSufficientFunds(user({ balance: 10_000 }), transaction({ amount: 2_500 }))).toBe(
      true
    );
    expect(hasSufficientFunds(user({ balance: 1_000 }), transaction({ amount: 2_500 }))).toBe(
      false
    );
  });
});

describe("user formatting", () => {
  test("joins first and last name", () => {
    expect(formatFullName(user())).toEqual("Ada Lovelace");
  });
});

describe("notification predicates", () => {
  const notificationBase = {
    id: "notification-1",
    uuid: "88ac1a1a-4b1a-4f0e-8b7f-2a1d6f3a5e0a",
    userId: "user-1",
    transactionId: "transaction-1",
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const likeNotification = {
    ...notificationBase,
    likeId: "like-1",
  } as unknown as LikeNotification;

  const commentNotification = {
    ...notificationBase,
    commentId: "comment-1",
  } as unknown as CommentNotification;

  const paymentNotification = {
    ...notificationBase,
    status: PaymentNotificationStatus.requested,
  } as unknown as PaymentNotification;

  test("distinguishes like, comment and payment notifications", () => {
    expect(isLikeNotification(likeNotification)).toBe(true);
    expect(isLikeNotification(commentNotification as NotificationType)).toBe(false);
    expect(isCommentNotification(commentNotification)).toBe(true);
    expect(isCommentNotification(likeNotification as NotificationType)).toBe(false);
    expect(isPaymentNotification(paymentNotification as NotificationType)).toBe(true);
    expect(isPaymentNotification(likeNotification as NotificationType)).toBe(false);
  });

  test("distinguishes requested from received payment notifications", () => {
    const received = {
      ...notificationBase,
      status: PaymentNotificationStatus.received,
    } as unknown as PaymentNotification;

    expect(isPaymentRequestedNotification(paymentNotification as NotificationType)).toBe(true);
    expect(isPaymentRequestedNotification(received as NotificationType)).toBe(false);
    expect(isPaymentReceivedNotification(received as NotificationType)).toBe(true);
    expect(isPaymentReceivedNotification(paymentNotification as NotificationType)).toBe(false);
  });
});

describe("query field helpers", () => {
  const query = {
    dateRangeStart: "2019-12-01T06:00:00.000Z",
    dateRangeEnd: "2019-12-05T06:00:00.000Z",
    amountMin: 5,
    amountMax: 10,
    page: 2,
    limit: 10,
    status: TransactionStatus.incomplete,
  };

  test("detects date, amount and pagination fields", () => {
    expect(hasDateQueryFields(query)).toBe(true);
    expect(hasDateQueryFields({ status: TransactionStatus.incomplete })).toBe(false);
    expect(hasAmountQueryFields(query)).toBe(true);
    expect(hasAmountQueryFields({ status: TransactionStatus.incomplete })).toBe(false);
    expect(hasPaginationQueryFields(query)).toBe(true);
    expect(hasPaginationQueryFields({ status: TransactionStatus.incomplete })).toBe(false);
  });

  test("picks and omits query fields", () => {
    expect(getDateQueryFields(query)).toEqual({
      dateRangeStart: query.dateRangeStart,
      dateRangeEnd: query.dateRangeEnd,
    });
    expect(getAmountQueryFields(query)).toEqual({ amountMin: 5, amountMax: 10 });
    expect(omitDateQueryFields(query)).not.toHaveProperty("dateRangeStart");
    expect(omitAmountQueryFields(query)).not.toHaveProperty("amountMin");
    expect(omitPaginationQueryFields(query)).not.toHaveProperty("page");
  });
});

describe("getPaginatedItems", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  test("returns the first page and total page count", () => {
    expect(getPaginatedItems(1, 3, items)).toEqual({ totalPages: 3, data: [1, 2, 3] });
  });

  test("returns a partial trailing page", () => {
    expect(getPaginatedItems(3, 3, items)).toEqual({ totalPages: 3, data: [7] });
  });

  test("returns no data past the last page", () => {
    expect(getPaginatedItems(5, 3, items).data).toEqual([]);
  });
});

describe("date conversion helpers", () => {
  const isoString = "2019-12-03T14:35:45.123Z";

  test("converts an ISO string to local midnight boundaries", () => {
    const start = isoStringToLocalMidnightStart(isoString);
    const end = isoStringToLocalMidnightEnd(isoString);

    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2019, 11, 3]);
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0]);
    expect([end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()]).toEqual([
      23, 59, 59, 999,
    ]);
  });

  test("converts an ISO string to a full local date", () => {
    const date = isoStringToLocalDateFull(isoString);

    expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual(
      [14, 35, 45, 123]
    );
  });

  test("converts a local date back to an ISO string", () => {
    const date = isoStringToLocalDateFull(isoString);

    expect(localDateToIsoString(date)).toEqual(isoString);
    expect(localDateToUTCISOString(date)).toEqual(isoString);
  });

  test("falls back to the current time for non-date values", () => {
    expect(() => new Date(localDateToUTCISOString(null)).toISOString()).not.toThrow();
  });

  test("computes UTC day boundaries", () => {
    const date = new Date(2019, 11, 3, 14, 35, 45, 123);

    expect(startOfDayUTC(date).toISOString()).toEqual("2019-12-03T00:00:00.000Z");
    expect(endOfDayUTC(date).toISOString()).toEqual("2019-12-03T23:59:59.999Z");
  });
});
