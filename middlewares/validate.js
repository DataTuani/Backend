// middlewares/validate.js
const { validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    console.log("PARAMS:", req.params);
    console.log("BODY:", req.body);
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

module.exports = validate;
