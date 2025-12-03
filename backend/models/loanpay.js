// models/payment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const loanPayment = sequelize.define("loanPayment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  loanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amountPaid: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATEONLY, // ✅ new field
    allowNull: false,
  },
  
});

module.exports = loanPayment;
