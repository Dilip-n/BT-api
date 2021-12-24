/*jshint esversion: 9 */
//Import filesystem
const fs = require("fs");
//Import path
const path = require("path");
//Import Sequelize
const Sequelize = require("sequelize");
//Import Settings
const { db } = require("./../../../../config/adaptor");
//Base
const basename = path.basename(__filename);
const dbObj = {};
let sequelize;

sequelize = new Sequelize(db.pg.uri, {
  logging: console.log,
  timezone: "+5:30",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

//const directories = path.resolve("app", "api", "v1", "db", "models");

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file !== "Schema.js" &&
      file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    dbObj[model.name] = model;
  });

Object.keys(dbObj).forEach((modelName) => {
  if (dbObj[modelName].associate) {
    dbObj[modelName].associate(dbObj);
  }
});

dbObj.sequelize = sequelize;
dbObj.Sequelize = Sequelize;

module.exports = dbObj;
