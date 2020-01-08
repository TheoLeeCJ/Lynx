module.exports = {
  AUTH_OK: {
    status: 200,
    success: true,
    message: "Authentication successful.",
  },
  GENERIC_OK: {
    status: 200,
    success: true,
    message: "Success",
  },
  BAD_REQUEST: {
    status: 400,
    success: false,
    message: "Bad Request",
  },
  INVALID_TOKEN: {
    status: 401,
    success: false,
    message: "Token is invalid.",
  },
  FORBIDDEN: {
    status: 403,
    success: false,
    message: "Forbidden",
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    success: false,
    message: "An internal error occurred.",
  },
};
