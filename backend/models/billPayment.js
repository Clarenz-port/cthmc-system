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
  }
});

module.exports = BillPayment;
