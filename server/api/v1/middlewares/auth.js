"use strict";
//Import JWT
const Jwt = require("jsonwebtoken");
//Import Settings
const { jwtSignature } = require("./../../../config/adaptor");
//Import Response Util
const Response = require("../utils/response");
class Auth {
  constructor() {}
  //JWT - Authentcation
  static jwtAuth = async (ctx, next) => {
    const authHeader = ctx.headers.authorization;
    //Check for Super App
    let superApp = null;
    let superAdmin = null;
    if (ctx.headers.app) {
      superApp = parseInt(ctx.headers.app);
      superAdmin = true;
    }
    if (!authHeader) {
      //If No Auth token
      return Response.unauthorized(ctx, {
        statusCode: 401,
        code: 41,
        msg: "No Token Provided",
      });
    }
    //Split token
    const token = authHeader.split(" ")[1]; //Authorization: Bearer token
    if (!token || token === "") {
      return Response.unauthorized(ctx, {
        statusCode: 401,
        code: 41,
        msg: "No Token Provided",
      });
    }
    try {
      const decoded = await Jwt.verify(token, jwtSignature.accessSecret);
      let appId = null;
      let siteId = null;
      //Get Super app if given
      if (superApp) {
        appId = superApp;
      } else {
        appId = decoded.appId;
      }
      //Check sites
      if (decoded.siteId && !decoded.isAdmin) {
        siteId = decoded.siteId;
      }
      if (!appId) {
        return Response.unauthorized(ctx, {
          statusCode: 400,
          code: 400,
          msg: "Something went wrong !",
        });
      }
      //Pass on the user to next controller
      ctx.state.user = decoded;
      ctx.state.appId = appId;
      ctx.state.siteId = siteId;
      //Next
      await next();
    } catch (err) {
      console.log(err);
      return Response.unauthorized(ctx, {
        statusCode: 401,
        code: 41,
        msg: "Unable to verify your credentials",
      });
    }
  };
}
//Export
module.exports = Auth;
