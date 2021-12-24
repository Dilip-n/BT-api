"use strict";
//Import Schema
const Schema = require("./Schema");

module.exports = (sequelize, DataTypes) => {
  const siteSchema = Schema(DataTypes).Schema.Site;
  const Site = sequelize.define("site", siteSchema);
  Site.associate = function (models) {
    // associations can be defined here
  };
  return Site;
};
