"use strict";
//Import Schema
const Schema = require("./Schema");
module.exports = (sequelize, DataTypes) => {
  //Get Schema
  const appSchema = Schema(DataTypes).Schema.App;
  const App = sequelize.define("app", appSchema);

  App.associate = function (models) {
    // associations can be defined here
  };
  return App;
};
