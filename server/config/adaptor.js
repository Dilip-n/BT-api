/*jshint esversion: 8 */
const path = require("path");
//Get all the settings
const setting = require("./settings.dev");

module.exports = {
  appName: "Bin Monitoring Backend",

  env: setting.appEnv,
  port: setting.appPort,
  logs: setting.appLog,

  //ip:'localhost', //This will not let app accesible on LAN
  ip: setting.appHost,

  root: path.normalize(`${__dirname}/../..`), // root
  base: path.normalize(`${__dirname}/..`), // base

  loginAPIServer: setting.loginAPIServer,

  logFileName: {
    info: "info.log",
    error: "exceptions.log",
  },
  db: {
    pg: {
      // PGSQL - Sample URI
      // uri: 'postgres://user:pass@example.com:5432/dbname'
      uri: (() => {
        //If Username Password is set
        if (setting.pgdbIsAuth === "true") {
          return `postgres://${setting.pgdbUsername}:${setting.pgdbPassword}@${setting.pgdbHost}:${setting.pgdbPort}/${setting.pgDbName}`;
        }
        //Without auth
        return `postgres://${setting.pgdbHost}:${setting.pgdbPort}/${setting.pgDbName}`;
      })(),

      masterDb: `${setting.pgDbName}`,
      options: {},
      host: setting.pgdbHost,
      port: setting.pgdbPort,
      username: setting.pgdbUsername,
      password: setting.pgdbPassword,
    },
  },
  jwtSignature: {
    accessSecret: setting.accessTokenSecret,
    refreshSecret: setting.refreshTokenSecret,
  },
  deviceLimit: setting.deviceLimit,
  emailSettings: {
    user: setting.mailUser,
    password: setting.mailPassword,
    host: setting.mailHost,
    port: setting.mailPort,
    secure: setting.mailSecure,
    unauthorized: setting.mailUnauthorized,
  },
};
