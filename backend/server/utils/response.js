export const sendSuccess = (
  res,
  { statusCode = 200, message = "Request successful", data = {} } = {},
) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

export const sendError = (res, message = "Request failed", statusCode = 500, error = null) => {
  const payload = {
    success: false,
    message,
  };
  if (error) payload.error = error;
  res.status(statusCode).json(payload);
};
