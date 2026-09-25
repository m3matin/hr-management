export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  UNSPECIFIED: "UNSPECIFIED",
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const EmployeeStatus = {
  ACTIVE: "ACTIVE",
  TERMINATED: "TERMINATED",
} as const;

export type EmployeeStatus =
  (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const SalaryReason = {
  INITIAL: "INITIAL",
  RAISE: "RAISE",
  ADJUSTMENT: "ADJUSTMENT",
  PROMOTION: "PROMOTION",
} as const;

export type SalaryReason = (typeof SalaryReason)[keyof typeof SalaryReason];
