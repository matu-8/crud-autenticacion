import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

export const userModel = sequelize.define("user", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  crop: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
