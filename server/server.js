"use strict";
//Import Koa
const Koa = require("koa");
//Import Koa Body Parser
const BodyParser = require("koa-bodyparser");
//Import Koa Cors
const Cors = require("@koa/cors");
//Import Koa Router
const Router = require("./api/v1/routes");
//Import Koa Morgan - Logger
const Morgan = require("koa-morgan");
//Import Services - DB - PG
const Services = require("./api/v1/db/models/pg");
//Koa
class App extends Koa {
  constructor(...params) {
    super(...params);

    this._setServices();
    this._setMiddlewares();
    this._setRoutes();
  }
  async _setServices() {
    Services;
  }
  _setMiddlewares() {
    //Body Parser
    this.use(
      BodyParser({
        enableTypes: ["json"],
        jsonLimit: "10mb",
      })
    );
    //CORS
    this.use(Cors());
    //Morgan - Request Logger
    this.use(Morgan("combined"));
  }
  _setRoutes() {
    // Application router
    this.use(Router.routes());
    this.use(Router.allowedMethods());
  }

  //Server listen
  listen(...args) {
    const server = super.listen(...args);
    return server;
  }
}
//Export App
module.exports = App;
