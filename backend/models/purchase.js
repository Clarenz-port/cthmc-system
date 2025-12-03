// models/purchase.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // adjust path to your db config

const Purchase = sequelize.define("Purchase", {
  userId: { type: DataTypes.INTEGER, allowNull: false }, // member id
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }, // array of { name, qty, unitPrice, lineTotal }
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },

});

module.exports = Purchase;
    