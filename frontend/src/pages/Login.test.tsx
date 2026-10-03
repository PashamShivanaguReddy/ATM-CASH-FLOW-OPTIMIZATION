import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { Login } from "./Login";

describe("Login form validation", () => {
  it("rejects malformed email and a missing password before calling the API", async () => {
    const user = userEvent.setup();
    render(<AuthProvider><MemoryRouter><Login /></MemoryRouter></AuthProvider>);

    await user.type(screen.getByLabelText("Work email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Enter a valid work email address.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });
});
