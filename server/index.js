"use strict";
//Import Server
const App = require("./server");
//Import Settings
const { ip, port, appName, env } = require("./config/adaptor");
//Instantiate App
const app = new App();
// Start server
const server = app.listen(port, ip, () => {
  console.log(
    `\n-------\n${appName} listening on ${ip}:${port}, in ${env}\n-------`
  );
});

// Expose app
module.exports = app;
