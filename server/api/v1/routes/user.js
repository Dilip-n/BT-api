"use strict";
//Import Koa Router
const Router = require("koa-router");
//Instantiate Router
const router = new Router();
//Import Controller
const Controller = require("./../controllers/user");
//Import Auth - Middleware
const Auth = require("./../middlewares/auth");
/*
 
! User Routes

*/
//Signin
router.post("/signin", Controller.signin);
//Get local Users
router.get("/", Auth.jwtAuth, Controller.getAllUsers);
//Add local User
router.post("/", Auth.jwtAuth, Controller.addUser);
//Update local User
router.patch("/:userId/details", Auth.jwtAuth, Controller.updateUser);
//Delete local User
router.delete("/:userId", Auth.jwtAuth, Controller.deleteUser);
//Get logged in user profile
router.get("/profile", Auth.jwtAuth, Controller.getProfile);
//Update profile
router.patch("/profile", Auth.jwtAuth, Controller.updateProfile);
//Export
module.exports = router;
