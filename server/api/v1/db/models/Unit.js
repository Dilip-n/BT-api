"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  const unitSchema = Schema(DataTypes).Schema.Unit;
  const Unit = sequelize.define("unit", unitSchema, {
    // don't add the timestamp attributes (updatedAt, createdAt)
    timestamps: false,
    // your other configuration here
  });
  Unit.associate = function (models) {
    // associations can be defined here
  };
  return Unit;
};
