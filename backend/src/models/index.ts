import Employee from "./employee.model.js";
import SalaryHistory from "./salary-history.model.js";
import User from "./user.model.js";

const employeeForeignKey = {
  name: "employeeId",
  field: "employee_id",
  allowNull: false,
} as const;

Employee.hasMany(SalaryHistory, {
  as: "salaryHistory",
  foreignKey: employeeForeignKey,
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

SalaryHistory.belongsTo(Employee, {
  as: "employee",
  foreignKey: employeeForeignKey,
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

export { Employee, SalaryHistory, User };
