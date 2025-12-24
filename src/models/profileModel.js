import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const profileModel = sequelize.define("profile", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  sector: {
    type: DataTypes.ENUM,
    allowNull: false,
  },
  age: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM,
    allowNull: false,
  },
});
