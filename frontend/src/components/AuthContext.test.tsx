import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { login } from "../api/client";
import { AuthProvider, useAuth } from "./AuthContext";

jest.mock("../api/client", () => ({
  login: jest.fn(),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;

function AuthConsumer() {
  const { token, login: signIn, logout } = useAuth();

  return (
    <div>
      <output aria-label="auth-token">{token ?? "signed-out"}</output>
      <button
        type="button"
        onClick={() => void signIn("hr@acme.com", "secret")}
      >
        Sign in
      </button>
      <button type="button" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}

function renderConsumer() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("restores an existing token on initial render", () => {
    localStorage.setItem("salary_token", "stored-token");

    renderConsumer();

    expect(screen.getByLabelText("auth-token")).toHaveTextContent(
      "stored-token",
    );
  });

  it("stores the token returned by a successful login", async () => {
    mockLogin.mockResolvedValueOnce({ token: "new-token" });

    renderConsumer();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("hr@acme.com", "secret");
      expect(localStorage.getItem("salary_token")).toBe("new-token");
      expect(screen.getByLabelText("auth-token")).toHaveTextContent(
        "new-token",
      );
    });
  });

  it("clears the token and local storage on logout", () => {
    localStorage.setItem("salary_token", "stored-token");
    renderConsumer();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(localStorage.getItem("salary_token")).toBeNull();
    expect(screen.getByLabelText("auth-token")).toHaveTextContent("signed-out");
  });
});
