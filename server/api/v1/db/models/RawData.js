"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  const rawDataSchema = Schema(DataTypes).Schema.RawData;
  const RawData = sequelize.define("raw_data", rawDataSchema, {
    // don't add the timestamp attributes (updatedAt, createdAt)
    timestamps: false,
    // your other configuration here
  });
  RawData.associate = function (models) {
    // associations can be defined here
    RawData.belongsTo(models.device, {
      foreignKey: {
        name: "deviceId",
      },
      as: "device",
      targetKey: "deviceId",
    });
  };
  return RawData;
};
