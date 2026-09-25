import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export class User extends Model {
  declare id: number;
  declare email: string;
  declare passwordHash: string;
  declare role: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(320),
      allowNull: false,
      unique: "users_email_unique",
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "HR_ADMIN",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true,
  },
);

export default User;
