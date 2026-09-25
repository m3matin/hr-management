import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const mockLogin = jest.fn();

jest.mock("../components/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe("LoginPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows an error on failed sign in", async () => {
    mockLogin.mockRejectedValueOnce(new Error("no"));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/Unable to sign in/)).toBeInTheDocument();
  });

  it("submits typed credentials", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "hr@acme.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("hr@acme.com", "secret"),
    );
  });
});
