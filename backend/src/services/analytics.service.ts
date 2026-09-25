import { QueryTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import "../models/index.js";

const groups = {
  country: "country",
  department: "department",
  roleTitle: "role_title",
  gender: "gender",
} as const;

type GroupBy = keyof typeof groups;

type NumericDatabaseValue = bigint | number | string;

interface PayByGroupRow {
  group: string;
  currency: string;
  avg_amount_minor: NumericDatabaseValue;
  median_amount_minor: NumericDatabaseValue;
  employee_count: NumericDatabaseValue;
}

interface PayrollTrendRow {
  period: Date | string;
  currency: string;
  total: NumericDatabaseValue;
  average: NumericDatabaseValue;
  count: NumericDatabaseValue;
}

function toBigIntString(value: NumericDatabaseValue): string {
  return BigInt(value).toString();
}

function toCount(value: NumericDatabaseValue): number {
  return Number(value);
}

function toPeriod(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : new Date(value).toISOString().slice(0, 10);
}

export async function payByGroup(groupBy: GroupBy, country?: string) {
  const column = groups[groupBy];
  const countryFilter = country ? "WHERE e.country = :country" : "";
  const sql = `
    WITH current_salary AS (
      SELECT DISTINCT ON (employee_id)
        employee_id,
        amount_minor,
        currency
      FROM salary_history
      ORDER BY employee_id, effective_date DESC, created_at DESC
    )
    SELECT
      e.${column}::text AS "group",
      s.currency,
      AVG(s.amount_minor)::bigint AS avg_amount_minor,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.amount_minor)::bigint
        AS median_amount_minor,
      COUNT(*)::bigint AS employee_count
    FROM employees e
    JOIN current_salary s ON s.employee_id = e.id
    ${countryFilter}
    GROUP BY e.${column}, s.currency
    ORDER BY "group", s.currency
  `;

  const [rows] = await sequelize.query<PayByGroupRow[]>(sql, {
    replacements: country ? { country } : {},
    type: QueryTypes.SELECT,
  });

  return {
    data: rows.map((row) => ({
      group: row.group,
      currency: row.currency,
      avgAmountMinor: toBigIntString(row.avg_amount_minor),
      medianAmountMinor: toBigIntString(row.median_amount_minor),
      employeeCount: toCount(row.employee_count),
    })),
  };
}

export async function payrollTrend(interval: "month" | "quarter") {
  const dateTrunc = interval === "quarter" ? "quarter" : "month";
  const sql = `
    WITH periods AS (
      SELECT generate_series(
        date_trunc('${dateTrunc}', CURRENT_DATE - interval '12 months'),
        date_trunc('${dateTrunc}', CURRENT_DATE),
        interval '1 ${interval}'
      ) AS period
    )
    SELECT
      p.period,
      s.currency,
      SUM(s.amount_minor)::bigint AS total,
      AVG(s.amount_minor)::bigint AS average,
      COUNT(*)::bigint AS count
    FROM periods p
    JOIN employees e ON e.status = 'ACTIVE'
    JOIN LATERAL (
      SELECT amount_minor, currency
      FROM salary_history
      WHERE employee_id = e.id
        AND effective_date <= (p.period + interval '1 ${interval}')
      ORDER BY effective_date DESC, created_at DESC
      LIMIT 1
    ) s ON true
    GROUP BY p.period, s.currency
    ORDER BY p.period, s.currency
  `;

  const [rows] = await sequelize.query<PayrollTrendRow[]>(sql, {
    type: QueryTypes.SELECT,
  });

  return {
    data: rows.map((row) => ({
      period: toPeriod(row.period),
      currency: row.currency,
      totalAmountMinor: toBigIntString(row.total),
      avgAmountMinor: toBigIntString(row.average),
      employeeCount: toCount(row.count),
    })),
  };
}
