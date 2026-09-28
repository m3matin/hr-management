import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

jest.mock("./AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <div>Private content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects an unauthenticated visitor to login", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  it("renders protected content for an authenticated visitor", () => {
    mockUseAuth.mockReturnValue({
      token: "token",
      login: jest.fn(),
      logout: jest.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText("Private content")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
