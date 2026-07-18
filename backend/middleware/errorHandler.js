const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = { notFound, errorHandler };
