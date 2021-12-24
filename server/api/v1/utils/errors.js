"use strict";

/**
 * Client Failures
 */
module.exports.AUTH_REQUIRED = {
  statusCode: 401,
  code: 41,
  alias: "AUTH_REQUIRED",
  message: "Authentication is needed to access the requested endpoint.",
};

module.exports.UNKNOWN_ENDPOINT = {
  statusCode: 404,
  code: 44,
  alias: "UNKNOWN_ENDPOINT",
  message: "The requested endpoint does not exist.",
};

module.exports.UNKNOWN_RESOURCE = {
  statusCode: 404,
  code: 44,
  alias: "UNKNOWN_RESOURCE",
  message: "The specified resource was not found.",
};

module.exports.INVALID_REQUEST_BODY_FORMAT = {
  statusCode: 422,
  code: 42,
  alias: "INVALID_REQUEST_BODY_FORMAT",
  message: "The request body has invalid format.",
};

module.exports.INVALID_REQUEST = {
  statusCode: 422,
  code: 42,
  alias: "INVALID_REQUEST",
  message: "The request has invalid parameters.",
};

/**
 * Server Errors
 */
module.exports.INTERNAL_ERROR = {
  statusCode: 500,
  code: 50,
  alias: "INTERNAL_ERROR",
  message: "The server encountered an internal error.",
};

module.exports.UNKNOWN_ERROR = {
  statusCode: 500,
  code: 50,
  alias: "UNKNOWN_ERROR",
  message: "The server encountered an unknown error.",
};
