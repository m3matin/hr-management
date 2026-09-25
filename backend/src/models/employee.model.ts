import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { EmployeeStatus, Gender } from "../enums.js";
import type { SalaryHistory } from "./salary-history.model.js";

export class Employee extends Model {
  declare id: number;
  declare employeeCode: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare country: string;
  declare department: string;
  declare roleTitle: string;
  declare gender: Gender;
  declare hireDate: string;
  declare status: EmployeeStatus;
  declare currency: string;
  declare salaryHistory?: SalaryHistory[];
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "employee_code",
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "role_title",
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: false,
      defaultValue: Gender.UNSPECIFIED,
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "hire_date",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EmployeeStatus)),
      allowNull: false,
      defaultValue: EmployeeStatus.ACTIVE,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "employees",
    timestamps: false,
    indexes: [
      {
        name: "employees_country_department_idx",
        fields: ["country", "department"],
      },
      {
        name: "employees_status_idx",
        fields: ["status"],
      },
    ],
  },
);

export default Employee;
