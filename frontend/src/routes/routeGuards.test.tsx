import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProtectedRoute } from "../components/routing/ProtectedRoute";
import { RoleProtectedRoute } from "../components/routing/RoleProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { makeSession } from "../test/authFixtures";

function renderProtectedUsers() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "BANK_ADMIN"]} />}>
              <Route path="/users" element={<h1>User directory</h1>} />
            </Route>
          </Route>
          <Route path="/login" element={<h1>Sign in required</h1>} />
          <Route path="/unauthorized" element={<h1>Access not permitted</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("protected routes", () => {
  it("redirects signed-out visitors to login", async () => {
    renderProtectedUsers();
    expect(await screen.findByRole("heading", { name: "Sign in required" })).toBeInTheDocument();
  });

  it("redirects authenticated users without the required role", async () => {
    localStorage.setItem("flowline.auth.session", JSON.stringify(makeSession("ATM_OPERATOR")));
    renderProtectedUsers();
    expect(await screen.findByRole("heading", { name: "Access not permitted" })).toBeInTheDocument();
  });

  it("allows an authorized user through", async () => {
    localStorage.setItem("flowline.auth.session", JSON.stringify(makeSession("BANK_ADMIN")));
    renderProtectedUsers();
    expect(await screen.findByRole("heading", { name: "User directory" })).toBeInTheDocument();
  });
});
