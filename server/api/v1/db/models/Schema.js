const { STRING } = require("sequelize");

module.exports = (input = {}) => {
  const Schema = {
    User: {
      id: {
        type: input.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      appId: input.INTEGER,
      siteId: input.INTEGER,
      name: input.STRING,
      email: input.STRING,
      mobile: input.STRING,
      password: input.STRING,
      address: input.STRING,
      isAdmin: input.STRING,
      createdAt: {
        type: input.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: input.DATE,
        allowNull: false,
      },
    },
    App: {
      id: {
        type: input.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: input.STRING,
      appId: input.STRING,
      status: input.STRING,
      address: input.STRING,
      appUrl: input.STRING,
      desc: input.STRING,
      token: input.STRING,
      mapToken: input.STRING,
      lat: input.DOUBLE,
      lng: input.DOUBLE,
      mapTokenLimit: input.INTEGER,
      mapTokenUsage: input.INTEGER,
    },
    Device: {
      id: {
        type: input.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      appId: input.INTEGER,
      isActive: input.BOOLEAN,
      deviceId: input.BIGINT,
      name: input.STRING,
      macAddress: input.STRING,
      addedBy: input.STRING,
      lat: input.DOUBLE,
      lng: input.DOUBLE,
      address: input.STRING,
      deviceSerialNo: input.BIGINT,
      simNumber: input.BIGINT,
      simGsmNumber: input.BIGINT,
      apnName: input.STRING,
      siteId: input.INTEGER,
      protocol: input.STRING,
      createdAt: {
        type: input.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: input.DATE,
        allowNull: false,
      },
    },
    Site: {
      id: {
        type: input.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      appId: input.INTEGER,
      name: {
        type: input.STRING,
        allowNull: false,
      },
      lat: {
        type: input.DOUBLE,
        allowNull: false,
      },
      lng: {
        type: input.DOUBLE,
        allowNull: false,
      },
      address: {
        type: input.STRING,
        allowNull: false,
      },
      createdAt: {
        type: input.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: input.DATE,
        allowNull: false,
      },
    },
    RawData: {
      time: {
        type: input.DATE,
        allowNull: false,
      },
      id: {
        type: input.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      appId: input.INTEGER,
      size: {
        type: input.STRING,
        allowNull: false,
      },
      deviceId: {
        type: input.STRING,
        allowNull: false,
      },
      dataFrom: {
        type: input.STRING,
        allowNull: false,
      },
      data: {
        type: input.JSONB,
        allowNull: false,
      },
      ingestTime: {
        type: input.DATE,
        allowNull: false,
      },
    },
    ReportSchdl: {
      name: {
        type: input.STRING,
        allowNull: false,
      },
      appId: input.INTEGER,
      frequency: {
        type: input.INTEGER,
        allowNull: false,
      },
      format: {
        type: input.STRING,
        allowNull: false,
      },
      siteId: {
        type: input.STRING,
        allowNull: false,
      },
      deviceId: {
        type: input.STRING,
        allowNull: false,
      },
      userId: {
        type: input.INTEGER,
        allowNull: false,
      },
      email: input.STRING,
      lastSentAt: {
        type: input.DATE,
        allowNull: true,
      },
      createdAt: {
        type: input.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: input.DATE,
        allowNull: false,
      },
    },
    RawDataData: {
      fill: "",
      temp: "",
      battery: "",
      bp: "",
      ts: "",
      gld: "",
      hbi: "",
      lat: "",
      lfl: "",
      lng: "",
      poi: "",
      tbh: "",
      ufl: "",
      alert: "",
      tamper: "",
    },
    Alert: {
      time: {
        type: input.DATE,
        //allowNull: false,
      },
      id: {
        type: input.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      appId: input.INTEGER,
      alertType: {
        type: input.STRING,
        allowNull: false,
      },
      alertLevel: {
        type: input.INTEGER,
        allowNull: false,
      },
      deviceId: {
        type: input.STRING,
        allowNull: false,
      },
      rule: {
        type: input.INTEGER,
        //allowNull: false,
      },
      value: {
        type: input.STRING,
        allowNull: false,
      },
      severity: {
        type: input.INTEGER,
        allowNull: false,
      },
      resolved: {
        type: input.BOOLEAN,
        allowNull: false,
      },
      resolvedBy: {
        type: input.INTEGER,
        allowNull: false,
      },
      desc: {
        type: input.STRING,
        allowNull: true,
      },
      resolvedAt: {
        type: input.DATE,
        allowNull: false,
      },
    },
    Unit: {
      appId: input.INTEGER,
      id: {
        type: input.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: input.STRING,
        allowNull: true,
      },
      ref: {
        type: input.STRING,
        allowNull: false,
      },
      uom: {
        type: input.STRING,
        allowNull: true,
      },
      format: {
        type: input.STRING,
        allowNull: true,
      },
    },
    RawDataLogs: {
      id: {
        type: input.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      appId: input.INTEGER,
      time: {
        type: input.DATE,
        allowNull: false,
      },
      deviceId: {
        type: input.STRING,
        allowNull: false,
      },
      raw_data: {
        type: input.STRING,
        allowNull: false,
      },
    },
  };
  //User Schema final
  const { password, ...UserSchema } = Schema.User;
  //Device Schema final
  const { isActive, ...DeviceSchema } = Schema.Device;
  //Raw data Schema final
  const { ingestTime, dataFrom, dataId, size, ...RawDataSchema } =
    Schema.RawData;
  //Raw Site Schema final
  const { ...SiteSchema } = Schema.Site;
  //Raw Data Logs Schema final
  const { ...RawDataLogs } = Schema.RawDataLogs;
  //Alert Schema
  const { resolvedAt, resolvedBy, rule, resolved, ...AlertSchema } =
    Schema.Alert;
  //Return
  return {
    Schema,
    UserSchema,
    DeviceSchema,
    RawDataSchema,
    SiteSchema,
    RawDataData: Schema.RawDataData,
    AlertSchema,
    RawDataLogs,
  };
};
