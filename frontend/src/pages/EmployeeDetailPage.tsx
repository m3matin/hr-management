import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchEmployee, updateEmployeeSalary } from "../api/client";
import type { Employee, SalaryReason } from "../types";
import {
  formatMoney,
  majorAmountToMinor,
  minorAmountToMajorAmount,
} from "../utils/formatMoney";

const salaryReasons: readonly SalaryReason[] = [
  "INITIAL",
  "RAISE",
  "ADJUSTMENT",
  "PROMOTION",
];

interface SalaryForm {
  amount: string;
  effectiveDate: string;
  reason: SalaryReason;
}

export function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const [employee, setEmployee] = useState<Employee>();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SalaryForm>({
    amount: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "RAISE",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setEmployee(await fetchEmployee(id));
    } catch {
      setError("Employee could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const amountMinor = majorAmountToMinor(form.amount);
    if (amountMinor === null) {
      setError("Enter a positive salary with no more than two decimal places.");
      return;
    }

    try {
      await updateEmployeeSalary(id, {
        amountMinor,
        effectiveDate: form.effectiveDate,
        reason: form.reason,
      });
      setOpen(false);
      await load();
    } catch {
      setError("Salary change could not be saved.");
    }
  }

  if (!employee) {
    return (
      <Stack spacing={2}>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void load()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <Typography>Loading employee…</Typography>
        )}
      </Stack>
    );
  }

  const currency = employee.currentSalaryCurrency || employee.currency;

  return (
    <>
      <Typography variant="h1" gutterBottom>
        {employee.firstName} {employee.lastName}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            alignItems="center"
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography>
                {employee.employeeCode} · {employee.roleTitle}
              </Typography>
              <Typography color="text.secondary">
                {employee.email} · {employee.department} · {employee.country} ·
                hired {employee.hireDate.slice(0, 10)}
              </Typography>
            </Box>
            <Chip
              label={employee.status}
              color={employee.status === "ACTIVE" ? "success" : "default"}
            />
            <Box>
              <Typography variant="h4">
                {formatMoney(employee.currentSalaryMinor, currency)}
              </Typography>
              <Typography variant="caption">Current annual salary</Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  amount: minorAmountToMajorAmount(employee.currentSalaryMinor),
                }));
                setOpen(true);
              }}
            >
              Record salary change
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h2" gutterBottom>
        Salary history
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Effective date</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employee.salaryHistory?.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.effectiveDate.slice(0, 10)}</TableCell>
              <TableCell>{item.reason}</TableCell>
              <TableCell align="right">
                {formatMoney(item.amountMinor, item.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        component="form"
        onSubmit={submit}
      >
        <DialogTitle>Record salary change</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <TextField
            autoFocus
            required
            label="Annual salary"
            type="number"
            inputProps={{ min: 0.01, step: 0.01 }}
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
          />
          <TextField
            required
            label="Effective date"
            type="date"
            value={form.effectiveDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                effectiveDate: event.target.value,
              }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            required
            label="Reason"
            value={form.reason}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reason: event.target.value as SalaryReason,
              }))
            }
          >
            {salaryReasons.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
