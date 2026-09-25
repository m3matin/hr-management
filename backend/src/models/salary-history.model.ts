import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { SalaryReason } from "../enums.js";
import type { Employee } from "./employee.model.js";

export class SalaryHistory extends Model {
  declare id: number;
  declare employeeId: number;
  declare amountMinor: bigint;
  declare currency: string;
  declare effectiveDate: string;
  declare reason: SalaryReason;
  declare createdAt: Date;
  declare employee?: Employee;
}

SalaryHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
    },
    amountMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "amount_minor",
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "effective_date",
    },
    reason: {
      type: DataTypes.ENUM(...Object.values(SalaryReason)),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "salary_history",
    timestamps: false,
    indexes: [
      {
        name: "salary_history_employee_effective_idx",
        fields: ["employee_id", "effective_date"],
      },
    ],
  },
);

export default SalaryHistory;
