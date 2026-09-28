import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Employee } from "../types";
import { fetchEmployees } from "../api/client";
import { EmployeesListPage } from "./EmployeesListPage";

jest.mock("../api/client", () => ({
  fetchEmployees: jest.fn(),
  isCanceledRequest: jest.fn(() => false),
}));

jest.mock("../components/EmployeeDataGrid", () => ({
  EmployeeDataGrid: ({
    rows,
    loading,
  }: {
    rows: Employee[];
    loading: boolean;
  }) => (
    <div>
      {loading ? <span>Loading grid</span> : null}
      {rows.map((row) => (
        <span key={row.id}>{`${row.firstName} ${row.lastName}`}</span>
      ))}
    </div>
  ),
}));

const mockFetchEmployees = fetchEmployees as jest.MockedFunction<
  typeof fetchEmployees
>;

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "1",
    employeeCode: "EMP-000001",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    country: "GB",
    department: "Engineering",
    roleTitle: "Software Engineer",
    gender: "FEMALE",
    hireDate: "2020-01-01",
    status: "ACTIVE",
    currency: "GBP",
    currentSalaryMinor: "100000",
    currentSalaryCurrency: "GBP",
    ...overrides,
  };
}

function list(items: Employee[] = [employee()]) {
  return {
    page: 1,
    pageSize: 25,
    total: items.length,
    totalPages: 1,
    items,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeesListPage />
    </MemoryRouter>,
  );
}

describe("EmployeesListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchEmployees.mockResolvedValue(list());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads and displays employee data", async () => {
    renderPage();

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(mockFetchEmployees).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 25 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("debounces search requests", async () => {
    jest.useFakeTimers();
    mockFetchEmployees.mockResolvedValue(list());
    renderPage();

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockFetchEmployees).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Search employees"), {
      target: { value: "Ada" },
    });

    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(mockFetchEmployees).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(mockFetchEmployees).toHaveBeenCalledTimes(2);
    expect(mockFetchEmployees).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "Ada", page: 1 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows an API error and retries", async () => {
    mockFetchEmployees
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(
        list([employee({ firstName: "Grace", lastName: "Hopper" })]),
      );

    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't load the employee directory",
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    });
    expect(mockFetchEmployees).toHaveBeenCalledTimes(2);
  });
});
