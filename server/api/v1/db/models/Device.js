"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  const deviceSchema = Schema(DataTypes).Schema.Device;
  const Device = sequelize.define("device", deviceSchema);

  Device.associate = function (models) {
    // associations can be defined here
    Device.hasMany(models.raw_data, {
      as: "data",
      foreignKey: {
        allowNull: false,
        name: "deviceId",
      },
      sourceKey: "deviceId",
    });
    Device.hasMany(models.alert, {
      as: "alert",
      foreignKey: "deviceId",
      sourceKey: "deviceId",
    });
    // Sites Association
    Device.hasOne(models.site, {
      foreignKey: {
        allowNull: false,
        name: "id",
      },
      sourceKey: "siteId",
    });
  };
  return Device;
};
