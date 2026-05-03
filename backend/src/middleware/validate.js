'use strict';
const { validationResult } = require('express-validator');

function validationErrorHandler(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map(e => ({ field: e.path, message: e.msg }));
    return res.status(400).json({ success: false, errors });
  }
  next();
}

module.exports = { validationErrorHandler };
