import { DataTypes } from "sequelize";
import { EmployeeStatus, Gender, SalaryReason } from "../enums.js";
import { Employee, SalaryHistory } from "../models/index.js";

describe("Sequelize model contract", () => {
  it("maps the employee schema to PostgreSQL names and constraints", () => {
    expect(Employee.getTableName()).toBe("employees");
    expect(Employee.getAttributes().employeeCode.field).toBe("employee_code");
    expect(Employee.getAttributes().roleTitle.field).toBe("role_title");
    expect(Employee.getAttributes().hireDate.type).toBeInstanceOf(
      DataTypes.DATEONLY,
    );
    expect(Employee.getAttributes().status.defaultValue).toBe(
      EmployeeStatus.ACTIVE,
    );
    expect(Employee.getAttributes().gender.defaultValue).toBe(
      Gender.UNSPECIFIED,
    );
    expect(Employee.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "employees_country_department_idx",
        }),
        expect.objectContaining({ name: "employees_status_idx" }),
      ]),
    );
  });

  it("stores salary amounts as bigint and keeps revision metadata", () => {
    expect(SalaryHistory.getTableName()).toBe("salary_history");
    expect(SalaryHistory.getAttributes().amountMinor.type).toBeInstanceOf(
      DataTypes.BIGINT,
    );
    expect(SalaryHistory.getAttributes().amountMinor.field).toBe(
      "amount_minor",
    );
    expect(SalaryHistory.getAttributes().effectiveDate.type).toBeInstanceOf(
      DataTypes.DATEONLY,
    );
    expect(SalaryHistory.getAttributes().reason.values).toEqual(
      expect.arrayContaining(Object.values(SalaryReason)),
    );
  });

  it("registers the employee salary-history association with cascade delete", () => {
    const history = Employee.associations.salaryHistory;
    const employee = SalaryHistory.associations.employee;
    const association = history as unknown as {
      foreignKeyField?: string;
      options: { onDelete?: string };
    };

    expect(history).toBeDefined();
    expect(employee).toBeDefined();
    expect(history?.foreignKey).toBe("employeeId");
    expect(association.foreignKeyField).toBe("employee_id");
    expect(association.options.onDelete).toBe("CASCADE");
  });
});
