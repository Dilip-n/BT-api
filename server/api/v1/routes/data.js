"use strict";
//Import Koa Router
const Router = require("koa-router");
//Instantiate Router
const router = new Router();
//Import Controller
const Controller = require("./../controllers/data");
//Import Auth - Middleware
const Auth = require("./../middlewares/auth");

/*

! Data Routes

*/
//Get devices
router.get("/devices", Auth.jwtAuth, Controller.getAllDevices);

//Get Reports -  Auth.jwtAuth
router.get("/reports", Auth.jwtAuth, Controller.getReports);

//Get Report Schedules
router.get("/report-schdls", Auth.jwtAuth, Controller.getReportSchdls);

//Add Report Schedules
router.post("/report-schdls", Auth.jwtAuth, Controller.AddReportSchdls);

//Delete Report Schedules
router.delete(
  "/report-schdls/:id",
  Auth.jwtAuth,
  Controller.deleteReportSchdls
);

//Get Graphs -
router.get("/graphs", Auth.jwtAuth, Controller.getGraphs);

//Get Units
router.get("/units", Auth.jwtAuth, Controller.getUnits);

//Get all device status
router.get("/device-status", Auth.jwtAuth, Controller.getAllDevicesStatus);

//Get all apps
router.get("/apps", Auth.jwtAuth, Controller.getAllApps);

//Get app info - based on token
router.post("/app-info", Auth.jwtAuth, Controller.getAppInfo);

//Add apps
router.post("/apps", Auth.jwtAuth, Controller.addApp);

//Get map api count
router.get("/map-token", Auth.jwtAuth, Controller.getMapApi);

//Push data
router.post("/push-raw-data", Controller.pushRawData);
//Add device
router.post("/devices", Auth.jwtAuth, Controller.addDevice);
//Get dashboard data
router.get("/dashboard", Auth.jwtAuth, Controller.getDashboard);
//Update device
router.patch("/devices/:deviceId", Auth.jwtAuth, Controller.updateDevice);
//Delete device
router.delete("/devices/:deviceId", Auth.jwtAuth, Controller.deleteDevice);

//Alert Api
router.get("/alerts", Auth.jwtAuth, Controller.getAlerts);

//Charts Api
router.get("/charts", Auth.jwtAuth, Controller.getCharts);

//Push Site Api
router.post("/sites", Auth.jwtAuth, Controller.AddSite);

//Get Site Api
router.get("/sites", Auth.jwtAuth, Controller.getSites);

//Update Site
router.patch("/sites/:id", Auth.jwtAuth, Controller.updateSite);

//Delete Site
router.delete("/sites/:id", Auth.jwtAuth, Controller.deleteSite);
//Get one site
router.get("/sites/:siteId", Auth.jwtAuth, Controller.getOneSite);

//Export
module.exports = router;
