"use strict";
//Import Axios
const Axios = require("axios");
//Import JWT
const Jwt = require("jsonwebtoken");
//Import Joi
const Joi = require("@hapi/joi");
//Import Bcrypt
const Bcrypt = require("bcrypt");

//Import Sequelize
const { Sequelize, Op, QueryTypes } = require("sequelize");
//User Schema
const Schema = require("./../db/models/Schema");
//Import Settings
const {
  loginAPIServer,
  dsAPIKey,
  jwtSignature,
} = require("./../../../config/adaptor");
//Import PG Models
const DB = require("./../db/models/pg");

//Import Response Util
const Response = require("../utils/response");
//Auth Controller
module.exports = class AuthHandler {
  constructor() {}
  //Signin
  static async signin(ctx, next) {
    const { email, password } = ctx.request.body;
    if (!email || !password) {
      return Response.badRequest(ctx, {
        code: 40,
        msg: "Please provide valid data !",
      });
    }
    let data = {};

    let isSuper = false;
    try {
      // Check if user exists locally
      const checkUser = await DB.user.findOne({
        raw: true,
        where: {
          email,
        },
        include: [
          {
            model: DB.app,
            attributes: ["id", "name", "lat", "lng"],
          },
          {
            model: DB.site,
            attributes: ["id", "name", "lat", "lng"],
          },
        ],
      });

      //If does not exists
      if (!checkUser) {
        return Response.unauthorized(ctx, {
          statusCode: 401,
          code: 41,
          msg: "Invalid credentials!",
        });
      }
      //Valid user - Check password
      const passwordCheck = await Bcrypt.compareSync(
        password,
        checkUser.password
      );
      if (!passwordCheck) {
        return Response.unauthorized(ctx, {
          statusCode: 401,
          code: 41,
          msg: "Password does not match!",
        });
      }
      // Units - to check super user
      const superU = await DB.unit.findOne({
        raw: true,
        where: {
          name: "addDataEmail",
          appId: checkUser.appId,
        },
      });
      if (superU && superU.ref === checkUser.email) {
        isSuper = true;
      }
      //If No app in connected
      if (!checkUser["app.id"] || !checkUser["app.name"]) {
        console.log("App not connected!");
        return Response.forbidden(ctx, {
          code: 43,
          msg: "Invalid credentials!",
        });
      }
      //Check for Admin users
      if (checkUser.isAdmin) {
        data.token = {
          id: checkUser.id,
          name: checkUser.name,
          email: checkUser.email,
          isAdmin: checkUser.isAdmin,
          isSuper,
          appId: checkUser["app.id"],
          app: checkUser["app.name"],
          lat: checkUser["app.lat"],
          lng: checkUser["app.lng"],
        };
      } else {
        if (!checkUser["site.id"] || !checkUser["site.name"]) {
          console.log("Site not connected!");
          return Response.forbidden(ctx, {
            code: 43,
            msg: "Invalid credentials!",
          });
        }
        data.token = {
          id: checkUser.id,
          name: checkUser.name,
          email: checkUser.email,
          isAdmin: checkUser.isAdmin,
          isSuper,
          appId: checkUser["app.id"],
          app: checkUser["app.name"],
          lat: checkUser["site.lat"],
          lng: checkUser["site.lng"],
          siteId: checkUser["site.id"],
          site: checkUser["site.name"],
        };
      }
      //JWT generate - accessToken
      const accessToken = Jwt.sign(data.token, jwtSignature.accessSecret, {
        expiresIn: "12h",
      });
      //Form data object
      data = {
        name: checkUser.name,
        email: checkUser.email,
        token: accessToken,
        isSuper,
        isAdmin: checkUser.isAdmin,
        site: {
          id: checkUser["site.id"],
          name: checkUser["site.name"],
          lat: checkUser["site.lat"],
          lng: checkUser["site.lng"],
        },
      };

      return Response.success(ctx, {
        statusCode: 200,
        code: 20,
        msg: "Successful login!",
        data,
      });
    } catch (err) {
      console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  }
  //All Users
  static getAllUsers = async (ctx, next) => {
    //Get User
    const user = ctx.state.user;
    //Get AppId
    const appId = ctx.state.appId;

    let selectFields = [];
    //Get User Schema
    const schemaObj = Schema().UserSchema;
    //Query field implementation
    if (ctx.query && ctx.query.fields) {
      const fields = ctx.query.fields;
      let tmpFields = fields.split(",");
      for (let i = 0; i < tmpFields.length; i++) {
        if (tmpFields[i].trim() in schemaObj) {
          //Push
          selectFields.push(tmpFields[i].trim());
        }
      }
    }
    //If no field provided
    if (selectFields.length < 1) {
      for (const property in schemaObj) {
        selectFields.push(property);
      }
    }
    try {
      // Check if user exists
      const users = await DB.user.findAll(
        {
          where: { appId },
          attributes: selectFields,
          include: [
            {
              model: DB.site,
              attributes: ["id", "name", "lat", "lng"],
            },
          ],
        },
        { raw: true }
      );
      if (users.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: users,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
        });
      }
    } catch (err) {
      // console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };

  //Add Users
  static addUser = async (ctx, next) => {
    //Get User
    const user = ctx.state.user;
    //Get AppId
    const appId = ctx.state.appId;
    //Get Input
    const { name, email, mobile, address, password, siteId } = ctx.request.body;

    if (!name || !email || !password || !mobile || !address || !siteId) {
      return Response.badRequest(ctx, {
        code: 40,
        msg: "Please provide valid data !",
      });
    }
    try {
      const Op = Sequelize.Op;
      // Check if user exists
      const checkUser = await DB.user.findAll({
        where: {
          [Op.or]: [{ email }, { mobile }],
        },
      });
      if (checkUser.length < 1) {
        //Hash the password
        const hash = Bcrypt.hashSync(password, 10);
        // Create a new user
        const newUser = await DB.user.create({
          name,
          email,
          mobile,
          address,
          isAdmin: false,
          password: hash,
          appId,
          siteId,
        });
        //Remove password
        // const { password, ...data } = newUser.dataValues;
        return Response.created(ctx, {
          code: 21,
          msg: "User Added!",
          data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            address: newUser.address,
            siteId,
          },
        });
      } else {
        return Response.conflict(ctx, {
          code: 20,
          msg: "User already exits!",
        });
      }
    } catch (err) {
      console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Update User
  static updateUser = async (ctx, next) => {
    const userId = ctx.params.userId;
    //Request Body
    const { name, email, mobile, password, address } = ctx.request.body;
    try {
      // Update a user
      let data = {};
      if (name) {
        data.name = name;
      }
      if (email) {
        data.email = email;
        // Check if user exists
        const userExists = await DB.user.findOne({
          where: {
            email,
          },
        });
        //If User exists with email/mobile
        if (userExists) {
          return Response.conflict(ctx, {
            code: 20,
            msg: "User already exits!",
          });
        }
      }
      if (mobile) {
        data.mobile = mobile;
        // Check if user exists
        const userExists = await DB.user.findOne({
          where: {
            mobile,
          },
        });
        //If User exists with email/mobile
        if (userExists) {
          return Response.conflict(ctx, {
            code: 20,
            msg: "User already exits!",
          });
        }
      }
      if (address) {
        data.address = address;
      }
      if (password) {
        //Hash the password
        const hash = Bcrypt.hashSync(password, 10);
        data.password = hash;
      }
      // Check if user exists
      const checkUser = await DB.user.findAll({
        where: {
          id: userId,
        },
      });
      if (checkUser.length == 1) {
        const updateUser = await DB.user.update(data, {
          where: { id: userId },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "User Details updated!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "User does not exits!",
        });
      }
    } catch (err) {
      console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Delete User
  static deleteUser = async (ctx, next) => {
    const userId = ctx.params.userId;
    if (!userId) {
      return Response.badRequest(ctx, {
        code: 40,
        msg: "Please provide valid data !",
      });
    }
    try {
      // Check if user exists
      const checkUser = await DB.user.findAll({
        where: {
          id: userId,
        },
      });
      if (checkUser.length == 1) {
        const deleteUser = await DB.user.destroy({
          where: {
            id: userId,
          },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "User Removed!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "User does not exits!",
        });
      }
    } catch (err) {
      console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Update Profile
  static updateProfile = async (ctx, next) => {
    //Get User
    const user = ctx.state.user;
    if (!user || !user.id) {
      return Response.forbidden(ctx, {
        code: 41,
        msg: "Unauthorized",
      });
    }

    const { name, mobile, password, address } = ctx.request.body;
    try {
      // Update a user
      let data = {};
      if (name) {
        data.name = name;
      }
      if (mobile) {
        data.mobile = mobile;
        // Check if user exists
        const userExists = await DB.user.findOne({
          where: {
            mobile,
          },
        });
        //If User exists with email/mobile
        if (userExists) {
          return Response.conflict(ctx, {
            code: 20,
            msg: "User already exits!",
          });
        }
      }
      if (address) {
        data.address = address;
      }
      if (password) {
        //Hash the password
        const hash = Bcrypt.hashSync(password, 10);
        data.password = hash;
      }
      // Check if user exists
      const checkUser = await DB.user.findOne({
        where: {
          id: user.id,
        },
      });
      if (checkUser) {
        //Update
        await DB.user.update(data, {
          where: { id: user.id },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "User Details updated!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "User does not exits!",
        });
      }
    } catch (err) {
      console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Get Profile
  static getProfile = async (ctx, next) => {
    //Get User
    const user = ctx.state.user;

    let selectFields = [];
    //Get User Schema
    const schemaObj = Schema().UserSchema;
    //Query field implementation
    if (ctx.query && ctx.query.fields) {
      const fields = ctx.query.fields;
      let tmpFields = fields.split(",");
      for (let i = 0; i < tmpFields.length; i++) {
        if (tmpFields[i].trim() in schemaObj) {
          //Push
          selectFields.push(tmpFields[i].trim());
        }
      }
    }
    //If no field provided
    if (selectFields.length < 1) {
      for (const property in schemaObj) {
        selectFields.push(property);
      }
    }
    if (!user || !user.id) {
      return Response.forbidden(ctx, {
        code: 41,
        msg: "Unauthorized",
      });
    }
    try {
      // Check if user exists
      const checkUser = await DB.user.findOne({
        where: {
          id: user.id,
        },
        attributes: selectFields,
      });
      if (checkUser) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records found !",
          data: checkUser,
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "User does not exits!",
        });
      }
    } catch (err) {
      console.log(err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
};
