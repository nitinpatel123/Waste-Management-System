export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// Central error handler: turns any thrown error into a clean JSON message.
// Unexpected (500) errors never leak internal details to the browser.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.status ? err.message : 'Server error. Please try again.';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.code === 11000) {
    status = 400;
    message = 'This value already exists';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB)' : 'Upload failed';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request is too large';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message });
};
