import axios from "axios";
import type {
  Employee,
  EmployeeList,
  PayGroup,
  SalaryHistory,
  SalaryReason,
  TrendPoint,
} from "../types";

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("salary_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("salary_token");
      if (location.pathname !== "/login") {
        location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export const login = (email: string, password: string) =>
  client
    .post<{ token: string }>("/auth/login", { email, password })
    .then((response) => response.data);

export const fetchEmployees = (
  params: Record<string, string | number | undefined>,
) => {
  const definedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );

  return client
    .get<EmployeeList>("/employees", { params: definedParams })
    .then((response) => response.data);
};

export const fetchEmployee = (id: string) =>
  client.get<Employee>(`/employees/${id}`).then((response) => response.data);

export const updateEmployeeSalary = (
  id: string,
  body: {
    amountMinor: number;
    effectiveDate: string;
    reason: SalaryReason;
  },
) =>
  client
    .patch<SalaryHistory>(`/employees/${id}/salary`, body)
    .then((response) => response.data);

export const fetchPayByGroup = (params: {
  groupBy: string;
  country?: string;
}) =>
  client
    .get<{ data: PayGroup[] }>("/analytics/pay-by-group", { params })
    .then((response) => response.data);

export const fetchPayrollTrend = (interval = "month") =>
  client
    .get<{ data: TrendPoint[] }>("/analytics/payroll-trend", {
      params: { interval },
    })
    .then((response) => response.data);
