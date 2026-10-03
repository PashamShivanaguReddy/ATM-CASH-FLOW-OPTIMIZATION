import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuthContext } from "./AuthContext";
import { makeSession } from "../test/authFixtures";

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock("../services/authService", () => authMocks);

function AuthProbe() {
  const { user, signIn, signOut } = useAuthContext();
  return (
    <div>
      <output>{user?.email ?? "signed out"}</output>
      <button onClick={() => void signIn("casey@example.com", "long-password")}>Sign in</button>
      <button onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    authMocks.login.mockResolvedValue(makeSession());
    authMocks.logout.mockResolvedValue(undefined);
    authMocks.refreshSession.mockResolvedValue(null);
  });

  it("stores the authenticated user and clears it on logout", async () => {
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("casey@example.com"));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByText("signed out")).toBeInTheDocument());
    expect(authMocks.login).toHaveBeenCalledWith("casey@example.com", "long-password");
    expect(authMocks.logout).toHaveBeenCalledOnce();
  });
});
