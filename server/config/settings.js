module.exports = {
  pgdbHost: process.env.BTS_PGDB_HOST || process.env.PGDB_HOST || "localhost",
  pgdbPort: process.env.BTS_PGDB_PORT || process.env.PGDB_PORT || "54323",
  pgdbIsAuth:
    process.env.BTS_PGDB_IS_AUTH || process.env.PGDB_IS_AUTH || "true",
  pgdbUsername:
    process.env.BTS_PGDB_USERNAME || process.env.PGDB_USERNAME || "master",
  pgdbPassword:
    process.env.BTS_PGDB_PASSWORD ||
    process.env.PGDB_PASSWORD ||
    "DHNNOQIYWMDZZPOQ",

  pgDbName: process.env.PGDB_NAME_VIG || "bin-app-vig",

  appPort: process.env.BTS_API_PORT || 3037,
  appHost: process.env.BTS_API_HOST || "0.0.0.0",

  appEnv: process.env.BTS_API_ENV || "dev",
  appLog: process.env.BTS_API_LOG || "dev",

  accessTokenSecret:
    process.env.BTS_API_ACCESS_TOKEN_SECRET ||
    "5A548FD77040AEA80DB67386CF48C0F228E56620A367712E72444DA6379BF65A",
  refreshTokenSecret:
    process.env.BTS_API_REFRESH_TOKEN_SECRET ||
    "6978EB463E14E65513F0E2FF422D2E597EC5AF48D734A59CC2472933550521DC",

  loginAPIServer:
    process.env.BTS_DS_API ||
    process.env.DS_API ||
    "http://localhost:3002/api/v1",

  deviceLimit: process.env.DEVICE_LIMIT || 30,

  mailHost:
    process.env.NOTIFICATION_HANDLER_MAIL_HOST ||
    process.env.MAIL_HOST ||
    "mail.hyperthinksys.com",

  mailPort:
    process.env.NOTIFICATION_HANDLER_MAIL_PORT ||
    process.env.MAIL_PORT ||
    "465",

  mailSecure:
    process.env.NOTIFICATION_HANDLER_MAIL_SECURE ||
    process.env.MAIL_SECURE ||
    "true",

  mailUser:
    process.env.NOTIFICATION_HANDLER_MAIL_USER ||
    process.env.MAIL_USER ||
    "notification@hyperthings.in",

  mailPassword:
    process.env.NOTIFICATION_HANDLER_MAIL_PASSWORD ||
    process.env.MAIL_PASSWORD ||
    "Things@020",

  mailUnauthorized:
    process.env.NOTIFICATION_HANDLER_MAIL_REJECT_UNAUTHORIZED ||
    process.env.MAIL_REJECT_UNAUTHORIZED ||
    "false",
};
