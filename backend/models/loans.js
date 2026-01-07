
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Loan = sequelize.define("Loan", {
  memberName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loanAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startMonth: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  endMonth: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // computed fields
  amortization: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  interest: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  serviceCharge: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  filingFee: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  capitalBuildUp: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  netAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },

  // balances
  balance: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  remainbalance: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  loanball: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },

  paymentsMade: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: "Pending",
  },

  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // who approved/rejected (optional)
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rejectedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // NEW: store check number used for approval
  checkNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Loan;