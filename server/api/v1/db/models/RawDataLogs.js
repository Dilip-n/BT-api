"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  const rawdataSchema = Schema(DataTypes).Schema.RawDataLogs;
  const RawDataLogs = sequelize.define("raw_data_logs", rawdataSchema, { timestamps: false });

  RawDataLogs.associate = function (models) {
    

  };
  return RawDataLogs;
};