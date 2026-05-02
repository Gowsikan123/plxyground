'use strict';
const { validationResult } = require('express-validator');

function validationErrorHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({ success: false, errors: formatted });
  }
  next();
}

module.exports = { validationErrorHandler };
