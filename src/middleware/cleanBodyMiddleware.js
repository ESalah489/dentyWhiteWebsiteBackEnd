export const cleanBody = (req, res, next) => {
  const isEmpty = (value) =>
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0);

  const cleaned = {};

  for (const key in req.body) {
    if (!isEmpty(req.body[key])) {
      cleaned[key] = req.body[key];
    }
  }

  req.body = cleaned;
  next();
};
