"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  const alertSchema = Schema(DataTypes).Schema.Alert;
  const Alert = sequelize.define("alert", alertSchema, { timestamps: false });

  Alert.associate = function (models) {
    // associations can be defined here
    Alert.hasOne(models.user, {
      foreignKey: {
        allowNull: false,
        name: "id",
      },
      sourceKey: "resolvedBy",
    });
    Alert.belongsTo(models.device, {
      foreignKey: {
        name: "deviceId",
      },
      targetKey: "deviceId",
    });
  };
  return Alert;
};
