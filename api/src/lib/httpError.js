export function httpError(status, message, code = "error") {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export function sendError(res, err) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Request failed.",
    code: err.code || "error",
  });
}
