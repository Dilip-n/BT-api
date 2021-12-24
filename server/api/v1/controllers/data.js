"use strict";
//Import Joi
const Joi = require("@hapi/joi");
//Import Sequelize
const { Sequelize, Op, QueryTypes, where } = require("sequelize");
//Import PG Models
const DB = require("./../db/models/pg");
//Import Axios
const Axios = require("axios");
//Import Settings
const { loginAPIServer, deviceLimit } = require("./../../../config/adaptor");
//Import Response Util
const Response = require("./../utils/response");
//Device Schema
const Schema = require("./../db/models/Schema");
//Import lodash
const _ = require("lodash");
//Import traverse
const Traverse = require("traverse");
//Import Moment
const Moment = require("moment");
//Import Utils
const UtilClass = require("./../utils");
//Instantiate
const Util = new UtilClass();
//Import flatten
const Flatten = require("flat");
//Default start date
//last 30 days
const defaultStartDate = Moment().subtract(30, "days").format("YYYY-MM-DD");

//Controller
module.exports = class DataHandler {
  //All Device
  static getAllDevices = async (ctx, next) => {
    //Get appId and siteId
    const appId = ctx.state.appId;
    const siteId = ctx.state.siteId;
    //Get date ranges
    const fromDate = ctx.query.fromDate;
    const toDate = ctx.query.toDate;
    let monthRange = false;
    if (ctx.query.fromDate && ctx.query.toDate) {
      monthRange = true;
    }
    let selectFields = [];
    //Get Device Schema
    const schemaObj = Schema().DeviceSchema;
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

    //Prepare conditions
    let whereCond = { appId };
    if (siteId != null) whereCond.siteId = siteId;
    // Find all Device
    let devices = [];
    try {
      if (monthRange) {
        // Device List
        devices = await DB.device.findAll({
          raw: true,
          attributes: selectFields,
          where: whereCond,
          include: [
            {
              model: DB.raw_data,
              as: "data",
              attributes: [Sequelize.literal("data->'data'->>'lat'")],
              where: {
                [Op.and]: [
                  Sequelize.where(Sequelize.literal("time"), ">=", fromDate),
                  Sequelize.where(Sequelize.literal("time"), "<=", toDate),
                ],
              },
            },
            {
              model: DB.site,
              attributes: ["id", "name", "lat", "lng"],
            },
          ],
        });
      } else {
        // Device List
        devices = await DB.device.findAll({
          attributes: selectFields,
          where: whereCond,
          include: [
            {
              attributes: [
                [DB.sequelize.literal(`data->'data'`), "data"],
                "time",
              ],
              model: DB.raw_data,
              as: "data",
              limit: 1,
              order: [["time", "desc"]],
            },
            {
              model: DB.site,
              attributes: ["id", "name", "lat", "lng"],
            },
          ],
        });
      }
      //
      if (devices.length > 0) {
        //
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: devices.map((device) => {
            return {
              ...device.dataValues,
              data:
                device.data.length > 0
                  ? Flatten(device.data[0].dataValues)
                  : null,
              latest:
                device.data.length > 0 ? device.data[0].dataValues.data : null,
            };
          }),
        });
      } else {
        const devicesNew = await DB.device.findAll({
          raw: true,
          where: whereCond,
          include: [
            {
              model: DB.site,
              attributes: ["id", "name", "lat", "lng"],
            },
          ],
        });
        if (devicesNew.length > 0) {
          return Response.success(ctx, {
            statusCode: 200,
            code: 20,
            msg: "Records Found!",
            data: devicesNew,
          });
        } else {
          return Response.success(ctx, {
            statusCode: 200,
            code: 20,
            msg: "No Records Found!",
            data: [],
          });
        }
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
  //Reports
  static getReports = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    //Get date range
    const fromDate = ctx.query.fromDate;
    const toDate = ctx.query.toDate;

    //Get report type
    const reportType = ctx.query.type;

    //All devices
    let devices = [];
    //Get device from query
    const device = ctx.query.deviceId;

    try {
      // Reports
      //If device level report
      //Push this device to devices array
      if (device) {
        devices.push(device);
      } else {
        //Fetch all Devices
        const deviceArray = await DB.device.findAll({
          raw: true,
          attributes: ["deviceId"],
          where: {
            appId,
          },
        });
        if (deviceArray.length > 0) {
          deviceArray.map((device) => {
            devices.push(device.deviceId);
          });
        }
      }
      //If no devices
      if (devices.length == 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
        });
      }
      // Devices
      const deviceArray = await DB.device.findAll({
        raw: true,
        attributes: ["deviceId", "name"],
        where: {
          deviceId: devices,
        },
      });

      let selectFields = [];
      let rawDataFields = [];
      //Final data and column
      let data = [];
      let columns = [];

      //Raq data report type
      //If no field provided
      if (selectFields.length < 1) {
        //Get Data Schema
        const schemaObj = Schema().RawDataSchema;
        const rawDataDataSchema = Schema().RawDataData;

        for (const property in schemaObj) {
          if (property != "data") selectFields.push(property);
        }
        for (const property in rawDataDataSchema) {
          rawDataFields.push(property);
        }
      }
      //Raw data report
      if (reportType === "raw") {
        //Data
        const rawData = await DB.raw_data.findAll({
          where: {
            [Op.and]: [
              { deviceId: devices },
              Sequelize.where(Sequelize.literal("time"), ">=", fromDate),
              Sequelize.where(Sequelize.literal("time"), "<=", toDate),
            ],
          },
          order: [["time", "desc"]],
        });

        if (rawData.length > 0) {
          selectFields = [...selectFields, "name"];
          columns = [...selectFields, ...rawDataFields];
          const removeFileds = ["appId", "id", "ts"];
          selectFields = selectFields.filter(
            (item) => !removeFileds.includes(item)
          );
          rawDataFields = rawDataFields.filter(
            (item) => !removeFileds.includes(item)
          );
          columns = columns.filter((item) => !removeFileds.includes(item));
          //Format the response
          rawData.map((row) => {
            let oneSet = [];
            selectFields.map((column) => {
              if (column === "name") {
                const temp = deviceArray.find(
                  (element) => element.deviceId === row.deviceId
                );
                oneSet.push(temp.name);
              } else {
                oneSet.push(row[column]);
              }
            });
            rawDataFields.map((col) => {
              oneSet.push(row["data"]["data"][col]);
            });

            data.push(oneSet);
          });
        }
      } else if (reportType === "fillReport") {
        //Fill report
        //Query
        const rawData = await DB.sequelize.query(
          `SELECT time AS date, "deviceId", avg(CAST(data->'data'->>'fill' AS float)) as fill
        FROM raw_data WHERE "deviceId" IN (:deviceIds) and time >= :fromDate and time <= :toDate and "appId" = :appId GROUP BY date, "deviceId" order by date desc `,
          {
            replacements: {
              deviceIds: devices,
              fromDate,
              toDate,
              appId,
            },
            type: QueryTypes.SELECT,
          }
        );
        //
        if (rawData.length > 0) {
          selectFields = ["date", "deviceId", "name", "fill"];
          columns = [...selectFields];
          //Format the response
          rawData.map((row) => {
            let oneSet = [];
            selectFields.map((column) => {
              if (column === "name") {
                const temp = deviceArray.find(
                  (element) => element.deviceId === row.deviceId
                );
                oneSet.push(temp.name);
              } else {
                oneSet.push(row[column]);
              }
            });
            data.push(oneSet);
          });
        }
      } else if (reportType === "rawLogs") {
        //Raw oacket logs report
        //Query
        const rawData = await DB.sequelize.query(
          `SELECT time AS date, "deviceId","raw_data"
        FROM raw_data_logs WHERE "deviceId" IN (:deviceIds) and time >= :fromDate and time <= :toDate and "appId" = :appId order by date desc `,
          {
            replacements: {
              deviceIds: devices,
              fromDate,
              toDate,
              appId,
            },
            type: QueryTypes.SELECT,
          }
        );
        //
        if (rawData.length > 0) {
          selectFields = ["date", "deviceId", "name", "raw_data"];
          columns = [...selectFields];
          //Format the response
          rawData.map((row) => {
            let oneSet = [];
            selectFields.map((column) => {
              if (column === "name") {
                const temp = deviceArray.find(
                  (element) => element.deviceId === row.deviceId
                );
                oneSet.push(temp.name);
              } else {
                oneSet.push(row[column]);
              }
            });
            data.push(oneSet);
          });
        }
      }

      //Response
      if (data.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: {
            columns,
            data,
          },
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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

  //Add Report Schedules
  static AddReportSchdls = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    //Get Input
    const inputs = ctx.request.body;

    //Input Validation Schema
    const schema = Joi.object({
      name: Joi.string().required(),
      frequency: Joi.number().required(),
      format: Joi.string().required(),
      siteId: Joi.string(),
      deviceId: Joi.string(),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "in"] } })
        .required(),
    });

    try {
      //Validate
      await schema.validateAsync(inputs);
    } catch (err) {
      console.log(err);
      return Response.unprocessableEntity(ctx, {
        code: 42,
        msg: "Please provide valid data !",
      });
    }
    try {
      //Get User
      const user = ctx.state.user;
      if (!user || !user.id) {
        return Response.forbidden(ctx, {
          code: 41,
          msg: "Unauthorized",
        });
      }
      // Create a new report schedule
      await DB.report_schedules.create({
        name: inputs.name,
        frequency: inputs.frequency,
        format: inputs.format,
        siteId: inputs.siteId,
        deviceId: inputs.deviceId,
        userId: user.id,
        email: inputs.email,
        appId,
      });
      return Response.created(ctx, {
        statusCode: 201,
        code: 20,
        msg: "Report Schedule Added!",
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
  };
  //Get All report Schedules
  static getReportSchdls = async (ctx, next) => {
    try {
      //Get AppId
      const appId = ctx.state.appId;
      // Report Schedules
      const rSchdls = await DB.report_schedules.findAll({
        where: {
          appId,
        },
        raw: true,
        attributes: { exclude: ["userId", "deviceId", "siteId"] },
        include: [
          {
            model: DB.device,
            as: "device",
            attributes: ["name"],
          },
          {
            model: DB.site,
            as: "site",
            attributes: ["name"],
          },
          {
            model: DB.user,
            as: "user",
            attributes: ["name"],
          },
        ],
      });

      if (rSchdls.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: rSchdls.map((row) => {
            return {
              ...row,
              user: row["userName.name"],
              device: row["deviceName.name"],
              site: row["siteName.name"],
            };
          }),
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Delete Report Schedules
  static deleteReportSchdls = async (ctx, next) => {
    //Get report schedule ID
    const id = ctx.params.id;
    if (!id) {
      return Response.badRequest(ctx, {
        code: 40,
        msg: "Please provide valid data !",
      });
    }
    try {
      // Check if report schedules
      const checkRSchdl = await DB.report_schedules.findAll({
        where: {
          id,
        },
      });
      if (checkRSchdl.length == 1) {
        const deleteRSchdl = await DB.report_schedules.destroy({
          where: {
            id,
          },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Report Schedule Removed!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "Report Schedule does not exits!",
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
  //All Units
  static getUnits = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    // Find all units
    try {
      // Units
      const units = await DB.unit.findAll({
        where: {
          appId,
        },
        raw: true,
      });

      if (units.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: units,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Graphs
  static getGraphs = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    //Get date range
    const fromDate = ctx.query.fromDate;
    const toDate = ctx.query.toDate;
    const interval = ctx.query.interval;
    //All devices
    let devices = [];
    //Get device from query
    const device = ctx.query.deviceId;

    if (!fromDate || !toDate || !interval) {
      return Response.badRequest(ctx, {
        code: 40,
        msg: "Please provide required fields !",
      });
    }
    //
    let selectFields = [];
    //Query field implementation
    const rawDataDataSchema = Schema().RawDataData;

    //If select fields is there
    if (ctx.query && ctx.query.fields) {
      const fields = ctx.query.fields;
      let tmpFields = fields.split(",");
      for (let i = 0; i < tmpFields.length; i++) {
        if (tmpFields[i].trim() in rawDataDataSchema) {
          let str = `avg(CAST(data->'data'->>'${tmpFields[
            i
          ].trim()}' AS FLOAT)) as ${tmpFields[i].trim()}`;
          selectFields.push(str);
        }
      }
      selectFields.toString();
    }
    //If no field provided
    if (selectFields.length < 1) {
      for (const property in rawDataDataSchema) {
        let str = `avg(CAST(data->'data'->>'${property}' AS FLOAT)) as ${property}`;
        selectFields.push(str);
      }
      selectFields.toString();
    }
    try {
      //If device level report
      //Push this device to devices array
      if (device) {
        devices.push(device);
      } else {
        //Fetch all Devices
        const deviceArray = await DB.device.findAll({
          raw: true,
          attributes: ["deviceId"],
        });
        if (deviceArray.length > 0) {
          deviceArray.map((device) => {
            devices.push(device.deviceId);
          });
        }
      }

      //If no devices
      if (devices.length == 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
          data: [],
        });
      }

      //Query
      const graphData = await DB.sequelize.query(
        `SELECT time_bucket_gapfill(:interval, time) AS date, ${selectFields}
        FROM raw_data WHERE "deviceId" IN (:deviceIds) and time >= :fromDate and time <= :toDate and "appId" = :appId GROUP BY date order by date desc;`,
        {
          replacements: {
            interval,
            deviceIds: devices,
            fromDate,
            toDate,
            appId,
          },
          type: QueryTypes.SELECT,
        }
      );

      //If some data
      if (graphData.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: graphData,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
          data: [],
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

  //Get all devices status
  static getAllDevicesStatus = async (ctx, next) => {
    try {
      //Get AppId
      const appId = ctx.state.appId;
      //Get siteId
      const siteId = ctx.state.siteId;
      //Prepare conditions
      let whereCond = `where d2."appId" = ${appId}`;
      if (siteId != null)
        whereCond = `${whereCond} and d2."siteId" = ${siteId}`;

      let devices = await DB.sequelize.query(
        `select * from devices d2 ${whereCond}`,
        {
          replacements: { appId: appId },
          type: QueryTypes.SELECT,
        }
      );

      let allDevicesStatus = [];

      let upCount = 0;
      let downCount = 0;

      await devices.map((device) => {
        if (device.state) {
          upCount = upCount + 1;
        } else {
          downCount = downCount + 1;
        }
      });

      if (devices.length > 0) {
        let data = {
          devices_up: upCount,
          devices_down: downCount,
        };

        let map = await devices.map(async (device) => {
          let last_msg_at = "";

          let lastMessageData = await DB.sequelize.query(
            `select "deviceId", "time" from raw_data a2 where  a2."deviceId" =:deviceId and a2."appId" =:appId  order by "time" desc;`,
            {
              replacements: { deviceId: device.deviceId, appId: appId },
              type: QueryTypes.SELECT,
            }
          );

          if (lastMessageData.length > 0) {
            last_msg_at = lastMessageData[0].time;
          }

          let obj = {
            id: device.id,
            last_msg_at: last_msg_at,
            state: device.state,
            device_id: device.deviceId,
          };

          allDevicesStatus.push(obj);
        });

        await Promise.all(map).then(async () => {
          if (allDevicesStatus.length > 0) {
            console.log("sending data.....");
            let result = {
              statusCode: 200,
              code: 20,
              msg: "Records Found!",
              data: allDevicesStatus,
            };
            return Response.success(ctx, result);
          } else {
            return Response.success(ctx, {
              statusCode: 200,
              code: 20,
              msg: "No Records Found!",
            });
          }
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
          data: [],
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

  //Get all apps
  static getAllApps = async (ctx, next) => {
    try {
      //Get AppId
      const appId = ctx.state.appId;
      // Check apps
      const apps = await DB.app.findAll({
        raw: true,
      });
      if (apps.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: apps,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Get app info from data sharing API.
  static getAppInfo = async (ctx, next) => {
    try {
      //Get app token
      const { token } = ctx.request.body;
      if (!token) {
        return Response.unprocessableEntity(ctx, {
          code: 42,
          msg: "Please provide valid data !",
        });
      }
      //Send request to Data sharing API with tokens
      const response = await Axios({
        method: "GET",
        url: `${loginAPIServer}/apps`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: response.data.data.results,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Add app
  static addApp = async (ctx, next) => {
    try {
      //Get app token
      const { token } = ctx.request.body;
      if (!token) {
        return Response.unprocessableEntity(ctx, {
          code: 42,
          msg: "Please provide valid data !",
        });
      }
      //Send request to Data sharing API with tokens
      const response = await Axios({
        method: "GET",
        url: `${loginAPIServer}/apps`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        // Check apps
        const appCheck = await DB.app.findOne({
          raw: true,
          where: {
            appId: response.data.data.results.appId,
          },
        });

        if (appCheck) {
          return Response.conflict(ctx, {
            code: 49,
            msg: "App already exists !",
          });
        }

        // Add a new app
        const newApp = await DB.app.create({
          name: response.data.data.results.name,
          appId: response.data.data.results.appId,
          status: response.data.data.results.status,
          address: response.data.data.results.address,
          appUrl: response.data.data.results.appUrl,
          desc: response.data.data.results.desc,
          token: response.data.data.results.token,
        });
        if (newApp) {
          //Get All units
          const units = await DB.unit.findAll({
            raw: true,
            where: {
              appId: 0,
            },
          });
          //Update appId
          if (units.length > 0) {
            units.map((unit) => {
              return (unit.appId = newApp.dataValues.id);
            });
          }
          //Create Units
          await DB.unit.bulkCreate(units);
          //Success
          return Response.created(ctx, {
            statusCode: 201,
            code: 20,
            msg: "App added!",
            data: {},
          });
        } else {
          return Response.badRequest(ctx, {
            statusCode: 400,
            code: 40,
            msg: "Unable to add app !",
          });
        }
      } else {
        return Response.badRequest(ctx, {
          statusCode: 400,
          code: 40,
          msg: "Unable to add app !",
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
  //Get Map API Count
  static getMapApi = async (ctx, next) => {
    try {
      //Get AppId
      const appId = ctx.state.appId;
      // Check app
      const app = await DB.app.findOne({
        raw: true,
        appId,
      });
      //If Found
      if (app) {
        //Check Map hit limit
        let limitReached = false;
        if (app.mapTokenUsage >= app.mapTokenLimit) {
          limitReached = true;
        }
        if (app.mapToken && !limitReached) {
          //Update Map usage count
          await DB.app.update(
            { mapTokenUsage: app.mapTokenUsage + 1 },
            {
              where: { id: app.id },
            }
          );
        }
        //Success
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: {
            mapToken: app.mapToken,
            limitReached,
          },
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Push Raw data
  static pushRawData = async (ctx, next) => {
    //Get Input
    const inputs = ctx.request.body;
    //Alert email
    let toEmail = "";
    let GetDeviceDetails = await DB.sequelize.query(
      `select d."appId" from devices d where d."deviceId" =:deviceId `,
      {
        replacements: { deviceId: inputs.deviceId },
        type: QueryTypes.SELECT,
      }
    );

    try {
      // Get units table data
      const units = await DB.unit.findAll({
        raw: true,
        where: {
          appId: GetDeviceDetails[0].appId,
          ref: ["dash_map_lat", "dash_map_lng", "addDataEmail"],
        },
      });
      if (GetDeviceDetails.length > 0) {
        if (
          inputs.lat == 0 ||
          inputs.lng == 0 ||
          inputs.lat == null ||
          inputs.lng == null
        ) {
          //Update
          inputs.lat = parseFloat(GetDeviceDetails[0].lat);
          inputs.lng = parseFloat(GetDeviceDetails[0].lng);
        }
        //Update
        if (units.length > 0) {
          units.map((unit) => {
            if (unit.ref == "addDataEmail") toEmail = unit.name;
          });
        }

        // Push raw data
        await DB.raw_data.create({
          deviceId: inputs.deviceId,
          time: new Date(),
          data: { ts: inputs.ts, data: inputs },
          ingestTime: new Date(),
          dataFrom: inputs.deviceId,
          size: JSON.stringify(inputs).length,
          appId: GetDeviceDetails[0].appId,
        });
        // Push raw data logs
        await DB.raw_data_logs.create({
          deviceId: inputs.deviceId,
          appId: GetDeviceDetails[0].appId,
          time: new Date(),
          raw_data: inputs.raw,
        });
        // alert managemnet
        if (inputs.battery < 20) {
          await DB.alert.create({
            deviceId: inputs.deviceId,
            time: new Date(),
            appId: GetDeviceDetails[0].appId,
            alertType: "Battery",
            alertLevel: 1,
            ruleId: 1,
            value: inputs.battery,
            severity: 3,
            resolved: true,
            resolvedBy: 1,
            resolvedAt: new Date(),
            desc: `Battery is low!`,
          });
          //Send email alert
          Util.sendMail(
            toEmail,
            "BT Alert",
            `Battery is low! ${inputs.battery} %`
          );
        }

        if (inputs.tamper == 1) {
          await DB.alert.create({
            deviceId: inputs.deviceId,
            time: new Date(),
            appId: GetDeviceDetails[0].appId,
            alertType: "Tamper",
            alertLevel: 1,
            ruleId: 1,
            value: inputs.tamper,
            severity: 3,
            resolved: true,
            resolvedBy: 1,
            resolvedAt: new Date(),
            desc: `Tampered Device!`,
          });
          //Send email alert
          Util.sendMail(toEmail, "BT Alert", `Tampered Device!`);
        }

        if (inputs.fill > 80) {
          await DB.alert.create({
            deviceId: inputs.deviceId,
            time: new Date(),
            appId: GetDeviceDetails[0].appId,
            alertType: "Fill",
            alertLevel: 1,
            ruleId: 1,
            value: inputs.fill,
            severity: 3,
            resolved: true,
            resolvedBy: 1,
            resolvedAt: new Date(),
            desc: `High Fill level!`,
          });
          //Send email alert
          Util.sendMail(
            toEmail,
            "BT Alert",
            `High Fill level! ${inputs.fill}%`
          );
        }
        //Response
        return Response.created(ctx, {
          statusCode: 201,
          code: 20,
          msg: "Added!",
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No App Id Found!",
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

  //Add device
  static addDevice = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    //Get siteId
    let siteId = ctx.state.siteId;
    //Get Logged in User ID
    const userId = ctx.state.user;
    //Get Input
    const {
      deviceId,
      name,
      lat,
      lng,
      address,
      deviceSerialNo,
      simNumber,
      simGsmNumber,
      apnName,
    } = ctx.request.body;
    //Get siteId form form for non admin user
    if (!siteId) siteId = ctx.request.body.siteId;
    //
    //Input Validation Schema
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      deviceId: Joi.string().required(),
      lat: Joi.number(),
      lng: Joi.number(),
      address: Joi.string(),
      deviceSerialNo: Joi.string(),
      simNumber: Joi.string(),
      simGsmNumber: Joi.string(),
      apnName: Joi.string(),
      siteId: Joi.number(),
    });
    try {
      //Validate
      const value = await schema.validateAsync(ctx.request.body);
      const devicesNew = await DB.device.findAll({
        raw: true,
        where: {
          appId,
        },
      });
      if (devicesNew.length < deviceLimit) {
        const Op = Sequelize.Op;
        const checkData = await DB.device.findAll({
          where: {
            [Op.or]: [{ deviceId }],
          },
        });
        if (checkData.length < 1) {
          const units = await DB.unit.findAll({
            raw: true,
            where: {
              ref: ["protocol", "rawPacket"],
            },
          });
          // Create a new data
          const newData = await DB.device.create({
            deviceId,
            macAddress: deviceId,
            deviceSerialNo,
            simNumber,
            simGsmNumber,
            apnName,
            name,
            lat,
            lng,
            address,
            appId,
            addedBy: userId.id,
            siteId,
            protocolType: units[1].name,
          });
          // Insert a new raw packet
          let rawPacket = JSON.parse(units[0].name);
          rawPacket.data.lat = lat;
          rawPacket.data.lng = lng;
          await DB.raw_data.create({
            deviceId,
            macAddress: deviceId,
            dataFrom: deviceId,
            time: "1970-1-1 00:00:00",
            ingestTime: "1970-1-1 00:00:00",
            appId,
            size: 0,
            data: rawPacket,
          });
          return Response.created(ctx, {
            code: 21,
            msg: "Device Added!",
            data: {
              deviceId: newData.deviceId,
              name: newData.name,
              macAddress: deviceId,
              lat: newData.lat,
              lng: newData.lng,
              address: newData.address,
              addedBy: newData.addedBy,
              appId: appId,
              siteId: siteId,
              deviceSerialNo: newData.deviceSerialNo,
              simNumber: newData.simNumber,
              simGsmNumber: newData.simGsmNumber,
              apnName: newData.apnName,
            },
          });
        } else {
          return Response.conflict(ctx, {
            code: 20,
            msg: "Device already exits!",
          });
        }
      } else {
        return Response.error(ctx, {
          statusCode: 422,
          code: 42,
          msg: "Number of devices are exceeded.",
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

  //Get dashboard data
  static getDashboard = async (ctx, next) => {
    //Get AppId
    let limit = 30;
    const appId = ctx.state.appId;
    const fields = ctx.query.fields;
    const order = ctx.query.order;
    if (ctx.query.limit) limit = ctx.query.limit;
    //Get date range
    const fromDate = ctx.query.fromDate;
    const toDate = ctx.query.toDate;

    if (!fromDate || !toDate || !fields) {
      return Response.badRequest(ctx, {
        code: 40,
        msg: "Please provide required fields !",
      });
    }
    try {
      const allData = await DB.sequelize.query(
        `select d2."deviceId" , d2."name" , cast(tm.data->'data'->>:name as float) as ${fields} from devices d2 join lateral(
        select "deviceId" as id, "data" from raw_data rd where "appId" = :appId and time >= :fromDate and time <= :toDate and "deviceId" = d2."deviceId" order by time desc limit 1) tm on(tm.id=d2."deviceId") order by tm.data->'data'->>:name ${order} limit :limit`,
        {
          replacements: {
            name: fields,
            limit,
            appId: appId,
            fromDate,
            toDate,
          },
          type: QueryTypes.SELECT,
        }
      );
      if (allData <= 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
          data: [],
        });
      }
      return Response.success(ctx, {
        statusCode: 200,
        code: 20,
        msg: "Records Found!",
        data: allData,
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
  };
  //Update Device
  static updateDevice = async (ctx, next) => {
    //Get Device
    const deviceId = ctx.params.deviceId;
    const {
      name,
      lat,
      lng,
      address,
      deviceSerialNo,
      simNumber,
      simGsmNumber,
      apnName,
    } = ctx.request.body;
    try {
      // Update a device
      let data = {};
      if (name) {
        data.name = name;
      }
      if (lat) {
        data.lat = lat;
      }
      if (lng) {
        data.lng = lng;
      }
      //Address updated
      if (address) {
        data.address = address;
      }
      if (deviceSerialNo) {
        data.deviceSerialNo = deviceSerialNo;
      }
      if (simNumber) {
        data.simNumber = simNumber;
      }
      if (simGsmNumber) {
        data.simGsmNumber = simGsmNumber;
      }
      if (apnName) {
        data.apnName = apnName;
      }
      // Check if device exists
      const checkDevice = await DB.device.findOne({
        where: {
          deviceId,
        },
      });
      if (checkDevice) {
        //Update
        await DB.device.update(data, {
          where: { deviceId },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Device updated!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "Device does not exits!",
        });
      }
    } catch (err) {
      console.log("Error: ", err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Delete Device
  static deleteDevice = async (ctx, next) => {
    //Get Device
    const deviceId = ctx.params.deviceId;
    try {
      // Check if device exists
      const checkDevice = await DB.device.findOne({
        where: {
          deviceId,
        },
      });
      if (checkDevice) {
        await DB.device.destroy({
          where: {
            deviceId,
          },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Device Removed!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "Device does not exits!",
        });
      }
    } catch (err) {
      console.log("Error: ", err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };

  // Alert fetch data
  static getAlerts = async (ctx, next) => {
    try {
      //Get AppId
      const appId = ctx.state.appId;
      // Check apps
      const newAlert = await DB.sequelize.query(
        `select * from alerts 
        where "appId" = :appId
        order by time desc 
        limit :limit `,
        {
          replacements: {
            limit: 10,
            appId,
          },
          type: QueryTypes.SELECT,
        }
      );
      if (newAlert.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: newAlert,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Get fill lever chart
  static getCharts = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    //Get siteId
    const siteId = ctx.state.siteId;
    const good = [];
    const avg = [];
    const high = [];
    var gnum = 0;
    var anum = 0;
    var hnum = 0;

    //Prepare conditions
    let whereCond = `where d."appId" = ${appId}`;
    if (siteId != null) whereCond = `${whereCond} and d."siteId" = ${siteId}`;
    try {
      const category = await DB.sequelize.query(
        `select d."deviceId", t."time", t.data::jsonb->'data'->>'fill' as fill
      from devices d left join lateral (
        select rd."deviceId", rd."data", rd."time" from raw_data rd 
        where rd."deviceId" = d."deviceId"
        order by rd."time" desc 
        limit 1
      )t
      on (t."deviceId" = d."deviceId") ${whereCond}`,
        {
          type: QueryTypes.SELECT,
        }
      );

      if (category.length > 0) {
        const data = category;
        for (var i in data) {
          if (data[i].fill <= 20) {
            gnum++;
            good.push(data[i]);
          } else if (data[i].fill <= 70) {
            anum++;
            avg.push(data[i]);
          } else {
            hnum++;
            high.push(data[i]);
          }
        }
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: { good: gnum, avg: anum, high: hnum },
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
        });
      }
    } catch (err) {
      console.log("Error: ", err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Add site
  static AddSite = async (ctx, next) => {
    //Get AppId
    const appId = ctx.state.appId;
    //Get Input
    const { name, lat, lng, address } = ctx.request.body;
    //Input Validation Schema
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      lat: Joi.number(),
      lng: Joi.number(),
      address: Joi.string(),
    });
    try {
      //Validate
      const value = await schema.validateAsync(ctx.request.body);
      // Push data
      const sites = await DB.site.create({
        name: name,
        address: address,
        appId: appId,
        lat: lat,
        lng: lng,
      });
      return Response.success(ctx, {
        statusCode: 200,
        code: 20,
        msg: "Sites added!",
        data: sites,
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
  };
  // Get all Sites
  static getSites = async (ctx, next) => {
    try {
      //Get AppId
      const appId = ctx.state.appId;
      // Check site
      const sites = await DB.sequelize.query(
        `select * from sites 
        where "appId" = :appId`,
        {
          replacements: {
            appId,
          },
          type: QueryTypes.SELECT,
        }
      );
      if (sites.length > 0) {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Records Found!",
          data: sites,
        });
      } else {
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "No Records Found!",
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
  //Update Site
  static updateSite = async (ctx, next) => {
    //Get site id
    const id = ctx.params.id;
    const { name, lat, lng, address } = ctx.request.body;
    try {
      // Update a Site
      let data = {};
      if (name) {
        data.name = name;
      }
      if (lat) {
        data.lat = lat;
      }
      if (lng) {
        data.lng = lng;
      }
      if (address) {
        data.address = address;
      }
      // Check if Site exists
      const checkSite = await DB.site.findOne({
        where: {
          id,
        },
      });
      if (checkSite) {
        //Update
        await DB.site.update(data, {
          where: { id },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Site updated!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "Site does not exits!",
        });
      }
    } catch (err) {
      console.log("Error: ", err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Delete Site
  static deleteSite = async (ctx, next) => {
    //Get Site
    const id = ctx.params.id;
    try {
      // Check if Site exists
      const checkSite = await DB.site.findOne({
        where: {
          id,
        },
      });
      if (checkSite) {
        await DB.site.destroy({
          where: {
            id,
          },
        });
        return Response.success(ctx, {
          statusCode: 200,
          code: 20,
          msg: "Site Removed!",
        });
      } else {
        return Response.notFound(ctx, {
          code: 20,
          msg: "Site does not exits!",
        });
      }
    } catch (err) {
      console.log("Error: ", err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
  //Get single site
  static getOneSite = async (ctx, next) => {
    try {
      //Get siteId
      const siteId = ctx.params.siteId;
      //Get AppId
      const appId = ctx.state.appId;

      // Check site
      const checkSite = await DB.site.findOne({
        where: {
          id: siteId,
          appId,
        },
      });

      if (checkSite) {
        return Response.success(ctx, {
          code: 20,
          msg: "Records found!",
          data: checkSite,
        });
      } else {
        return Response.notFound(ctx, {
          code: 44,
          msg: "Site does not exits!",
        });
      }
    } catch (err) {
      console.log("Error: ", err);
      return Response.error(ctx, {
        statusCode: 500,
        code: 50,
        msg: "Internal Error",
        error: err,
      });
    }
  };
};
