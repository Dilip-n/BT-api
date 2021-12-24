"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  const reportSchdlSchema = Schema(DataTypes).Schema.ReportSchdl;
  const ReportSchedule = sequelize.define(
    "report_schedules",
    reportSchdlSchema
  );
  ReportSchedule.associate = function (models) {
    // associations can be defined here
    ReportSchedule.belongsTo(models.device, {
      foreignKey: {
        name: "deviceId",
      },
      as: "device",
      targetKey: "deviceId",
    });
    ReportSchedule.belongsTo(models.user, {
      foreignKey: {
        name: "userId",
      },
      as: "user",
      targetKey: "id",
    });
  };
  return ReportSchedule;
};
