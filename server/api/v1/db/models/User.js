"use strict";
//Import Schema
const Schema = require("./Schema");

module.exports = (sequelize, DataTypes) => {
  const userSchema = Schema(DataTypes).Schema.User;
  const User = sequelize.define("user", userSchema);
  User.associate = function (models) {
    // associations can be defined here
    User.hasOne(models.app, {
      foreignKey: {
        allowNull: false,
        name: "id",
      },
      sourceKey: "appId",
    });
    // Sites Association
    User.hasOne(models.site, {
      foreignKey: {
        allowNull: false,
        name: "id",
      },
      sourceKey: "siteId",
    });
  };
  return User;
};
