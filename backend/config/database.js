// config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",
  timezone: "+08:00", // <-- IMPORTANT: write dates in PH time
  dialectOptions: {
    // keep date/time types as strings to avoid implicit timezone conversion on read
    dateStrings: true,
    typeCast: function (field, next) {
      // Return string for DATETIME / TIMESTAMP fields
      if (field.type === "DATETIME" || field.type === "TIMESTAMP") return field.string();
      return next();
    },
  },
  define: {
    timestamps: true,
  },
  logging: false,
});

module.exports = sequelize;
