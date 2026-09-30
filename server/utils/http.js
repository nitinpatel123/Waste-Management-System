// Small helpers so every route handles errors the same way.
export const httpError = (status, message) => Object.assign(new Error(message), { status });

// Express 4 does not catch errors from async routes by itself.
// Without this wrapper, one bad request can crash the whole server.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
