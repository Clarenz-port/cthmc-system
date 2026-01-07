const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notice = sequelize.define("Notice", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Notice;
