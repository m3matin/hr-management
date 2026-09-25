import { Box, TextField, MenuItem, Stack, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { fetchEmployees, isCanceledRequest } from "../api/client";
import { Employee, EmployeeList } from "../types";
import { formatMoney } from "../utils/formatMoney";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const EMPTY_ROWS: Employee[] = [];
const DataGrid = lazy(() =>
  import("../components/EmployeeDataGrid").then(
    ({ EmployeeDataGrid: component }) => ({ default: component }),
  ),
);

export function EmployeesListPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<EmployeeList>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    department: "",
    status: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const requestFilters = useMemo(
    () => ({ search: debouncedSearch, ...filters }),
    [debouncedSearch, filters],
  );
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const previousSearch = useRef(debouncedSearch);
  const searchChanged = previousSearch.current !== debouncedSearch;
  const requestPage = searchChanged ? 0 : paginationModel.page;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        setResult(
          await fetchEmployees(
            {
              ...requestFilters,
              page: requestPage + 1,
              pageSize: paginationModel.pageSize,
            },
            { signal },
          ),
        );
      } catch (error: unknown) {
        if (!isCanceledRequest(error)) {
          setError(
            "We couldn't load the employee directory. Please try again.",
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [paginationModel.pageSize, requestFilters, requestPage],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    previousSearch.current = debouncedSearch;
    setPaginationModel((current) =>
      current.page === 0 ? current : { ...current, page: 0 },
    );
  }, [debouncedSearch]);

  const updateFilter = (name: string, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const columns = useMemo<GridColDef<Employee>[]>(
    () => [
      { field: "employeeCode", headerName: "Code", width: 125 },
      {
        field: "name",
        headerName: "Name",
        flex: 1.2,
        minWidth: 190,
        valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
      },
      { field: "email", headerName: "Email", flex: 1.2, minWidth: 210 },
      { field: "country", headerName: "Country", width: 90 },
      { field: "department", headerName: "Department", width: 150 },
      { field: "roleTitle", headerName: "Role", flex: 1, minWidth: 160 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
          <span
            style={{
              color: params.value === "ACTIVE" ? "#15803d" : "#667085",
              background: params.value === "ACTIVE" ? "#dcfce7" : "#f1f3f7",
              borderRadius: 999,
              display: "inline-flex",
              padding: "4px 9px",
              fontSize: 11,
              fontWeight: 750,
            }}
          >
            {params.value === "ACTIVE" ? "Active" : "Terminated"}
          </span>
        ),
      },
      {
        field: "salary",
        headerName: "Current salary",
        width: 160,
        valueGetter: (_value, row) =>
          formatMoney(
            row.currentSalaryMinor,
            row.currentSalaryCurrency || row.currency,
          ),
      },
    ],
    [],
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1" gutterBottom>
          Employees
        </Typography>
        <Typography color="text.secondary">
          Search, filter, and review compensation records across the team.
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1.4fr 1fr" },
          gap: 1.5,
        }}
      >
        <TextField
          label="Search employees"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Name, email, or code"
        />
        <TextField
          select
          label="Country"
          value={filters.country}
          onChange={(event) => updateFilter("country", event.target.value)}
        >
          <MenuItem value="">All countries</MenuItem>
          {["US", "IN", "GB", "DE", "CA", "AU", "SG", "JP"].map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Department"
          value={filters.department}
          onChange={(event) => updateFilter("department", event.target.value)}
          placeholder="e.g. Engineering"
        />
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="TERMINATED">Terminated</MenuItem>
        </TextField>
      </Box>
      {error && (
        <Box
          role="alert"
          sx={{
            p: 1.5,
            borderRadius: 2,
            color: "#b91c1c",
            bgcolor: "#fef2f2",
            fontSize: 14,
          }}
        >
          {error}{" "}
          <button
            type="button"
            onClick={() => void load()}
            style={{ marginLeft: 8, color: "inherit", fontWeight: 700 }}
          >
            Retry
          </button>
        </Box>
      )}
      <Box
        sx={{
          height: { xs: 560, md: 650 },
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: "0 8px 28px rgba(23,32,51,.04)",
        }}
      >
        <Suspense
          fallback={
            <Box sx={{ p: 3, color: "text.secondary" }}>Loading employees…</Box>
          }
        >
          <DataGrid
            rows={result?.items ?? EMPTY_ROWS}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={result?.total ?? 0}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[25, 50, 100]}
            onRowClick={(params) => navigate(`/employees/${params.row.id}`)}
            disableRowSelectionOnClick
            disableColumnMenu
          />
        </Suspense>
      </Box>
    </Stack>
  );
}
