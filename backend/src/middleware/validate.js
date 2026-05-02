'use strict';

const { validationResult } = require('express-validator');

/**
 * Express middleware that reads express-validator results.
 * Returns 422 with an errors array if any validations failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = validate;
