import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

export const nutrientModel = sequelize.define("nutrient", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  measure_unit:{
    type: DataTypes.STRING,
    allowNull:false
  }
});
