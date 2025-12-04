const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BillPayment = sequelize.define("BillPayment", {
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  billName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "cash"
  }
}, {
  tableName: "BillPayments",
  timestamps: true
});

module.exports = BillPayment;
