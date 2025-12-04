// models/dividend.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Dividend = sequelize.define("Dividend", {
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Dividend;
