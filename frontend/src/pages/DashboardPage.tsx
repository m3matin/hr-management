import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPayByGroup, fetchPayrollTrend } from "../api/client";
import { PayGroup, TrendPoint } from "../types";
import { formatMoney } from "../utils/formatMoney";

const chartColors = ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#0891b2"];

export function DashboardPage() {
  const [groupBy, setGroupBy] = useState("country");
  const [country, setCountry] = useState("");
  const [groups, setGroups] = useState<PayGroup[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pay, payroll] = await Promise.all([
        fetchPayByGroup({ groupBy, country: country || undefined }),
        fetchPayrollTrend(),
      ]);
      setGroups(pay.data);
      setTrend(payroll.data);
    } catch {
      setError("We couldn't load compensation analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [groupBy, country]);

  useEffect(() => {
    void load();
  }, [load]);

  const currencies = useMemo(
    () => [...new Set(groups.map((item) => item.currency))],
    [groups],
  );
  const trendByCurrency = useMemo(
    () =>
      trend.reduce<Record<string, TrendPoint[]>>((result, point) => {
        (result[point.currency] ||= []).push(point);
        return result;
      }, {}),
    [trend],
  );
  const employeeCount = groups.reduce(
    (total, item) => total + item.employeeCount,
    0,
  );

  const groupData = groups.map((row) => ({
    ...row,
    label: `${row.group} (${row.currency})`,
    average: Number(row.avgAmountMinor) / 100,
    median: Number(row.medianAmountMinor) / 100,
  }));
  const tickFormatter = (value: number) => value.toLocaleString();

  if (loading && groups.length === 0) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={280} height={52} />
        <Skeleton variant="rounded" height={112} />
        <Skeleton variant="rounded" height={390} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1" gutterBottom>
          Compensation overview
        </Typography>
        <Typography color="text.secondary">
          Understand how pay is distributed across your organisation without
          mixing currencies.
        </Typography>
      </Box>
      {error && (
        <Alert
          severity="error"
          action={
            <button type="button" onClick={() => void load()}>
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      )}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl sx={{ minWidth: { xs: "100%", md: 210 } }}>
              <InputLabel id="group-by-label">Group by</InputLabel>
              <Select
                labelId="group-by-label"
                label="Group by"
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value)}
              >
                <MenuItem value="country">Country</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="roleTitle">Role</MenuItem>
                <MenuItem value="gender">Gender</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Country filter"
              value={country}
              onChange={(event) =>
                setCountry(event.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="e.g. US"
              inputProps={{ maxLength: 2 }}
              helperText="Use a two-letter country code"
            />
          </Stack>
        </CardContent>
      </Card>
      {currencies.length > 1 && (
        <Alert severity="info">
          This view contains multiple currencies. Amounts remain separated by
          currency and are never summed or converted.
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Employees represented
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.5 }}>
              {employeeCount || "—"}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Currencies in view
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.5 }}>
              {currencies.length || "—"}
            </Typography>
          </CardContent>
        </Card>
      </Box>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h2" gutterBottom>
            Average and median salary
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Annual compensation by {groupBy === "roleTitle" ? "role" : groupBy}.
          </Typography>
          {groupData.length > 0 ? (
            <Box sx={{ height: 360, width: "100%" }}>
              <ResponsiveContainer>
                <BarChart
                  data={groupData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid stroke="#edf0f5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#667085" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#667085" }}
                    tickFormatter={tickFormatter}
                    width={70}
                  />
                  <Tooltip
                    formatter={(_value: unknown, name: unknown, item) =>
                      formatMoney(
                        String(name) === "Median"
                          ? item.payload.medianAmountMinor
                          : item.payload.averageAmountMinor,
                        item.payload.currency,
                      )
                    }
                    labelStyle={{ fontWeight: 700 }}
                  />
                  <Legend />
                  <Bar
                    dataKey="average"
                    name="Average"
                    fill={chartColors[0]}
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="median"
                    name="Median"
                    fill={chartColors[2]}
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography color="text.secondary">
              No compensation data is available for this filter.
            </Typography>
          )}
        </CardContent>
      </Card>
      <Box>
        <Typography variant="h2" gutterBottom>
          Average salary trend
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Active employee payroll by currency over the last 12 months.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {Object.entries(trendByCurrency).map(([currency, points], index) => (
            <Card key={currency}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography variant="h3" sx={{ mb: 1.5 }}>
                  {currency}
                </Typography>
                <Box sx={{ height: 280, width: "100%" }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={points.map((point) => ({
                        ...point,
                        average: Number(point.avgAmountMinor) / 100,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid stroke="#edf0f5" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11, fill: "#667085" }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#667085" }}
                        tickFormatter={tickFormatter}
                        width={62}
                      />
                      <Tooltip
                        formatter={(_value: unknown, _name, item) =>
                          formatMoney(
                            item.payload.averageAmountMinor,
                            item.payload.currency,
                          )
                        }
                        labelStyle={{ fontWeight: 700 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        name="Average salary"
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        {trend.length === 0 && !loading && (
          <Typography color="text.secondary">
            No trend data is available.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
