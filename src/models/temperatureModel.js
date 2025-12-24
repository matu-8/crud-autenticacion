import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

export const temperatureModel = sequelize.define("temperature", {
  measure: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});
