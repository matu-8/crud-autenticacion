import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

export const cropModel = sequelize.define("crop", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  grow_time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nutrients: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
