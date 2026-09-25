import { DataGrid } from "@mui/x-data-grid";
import type { DataGridProps } from "@mui/x-data-grid";
import type { Employee } from "../types";

/**
 * Keeps the employee row generic at the page boundary while allowing the
 * relatively large Data Grid implementation to load as its own route chunk.
 */
export function EmployeeDataGrid(props: DataGridProps<Employee>) {
  return <DataGrid {...props} />;
}
