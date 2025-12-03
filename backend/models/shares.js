// models/shares.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Shares = sequelize.define("Shares", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shareamount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM("GCash", "Cash"),
    allowNull: false,
    defaultValue: "Cash"
  }
});

module.exports = Shares;
