"use strict";
//Import Koa Router
const Router = require("koa-router");
//Import User Routes
const User = require("./user");
//Import Data Routes
const Data = require("./data");
//Instantiate Router
const router = new Router({
  prefix: "/api/v1",
});
//Test Route
router.get("/status", (ctx, next) => {
  ctx.body = "Running!";
});
//User Routes
router.use("/users", User.routes());
//Data Routes
router.use("/data", Data.routes());
//Export
module.exports = router;
