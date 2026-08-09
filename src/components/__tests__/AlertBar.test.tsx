import React from "react";
import { afterEach, describe, expect, test } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { interpret } from "xstate";
import AlertBar from "../AlertBar";
import { snackbarMachine } from "../../machines/snackbarMachine";

const startService = () => interpret(snackbarMachine).start();

let service: ReturnType<typeof startService>;

afterEach(() => service?.stop());

describe("AlertBar", () => {
  test("stays hidden while the snackbar machine is invisible", () => {
    service = startService();

    render(<AlertBar snackbarService={service as any} />);

    expect(screen.queryByTestId(/alert-bar/)).not.toBeInTheDocument();
  });

  test("shows the message and severity sent to the snackbar machine", () => {
    service = startService();
    render(<AlertBar snackbarService={service as any} />);

    act(() => {
      service.send({ type: "SHOW", severity: "error", message: "Something went wrong" });
    });

    expect(screen.getByTestId("alert-bar-error")).toHaveTextContent("Something went wrong");
  });

  test("hides again once the snackbar machine hides", () => {
    service = startService();
    render(<AlertBar snackbarService={service as any} />);
    act(() => {
      service.send({ type: "SHOW", severity: "success", message: "Saved" });
    });

    act(() => {
      service.send("HIDE");
    });

    expect(screen.queryByTestId("alert-bar-success")).not.toBeInTheDocument();
  });
});
