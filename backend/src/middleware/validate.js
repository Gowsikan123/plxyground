'use strict';

const { validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return res.status(400).json({ errors: formatted });
  }
  return next();
}

module.exports = { handleValidation };
