'use strict';

/**
 * Pagination helper — parse and validate page/limit query params,
 * build LIMIT/OFFSET SQL clause, and format the meta response.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination params from an Express request query.
 * @param {import('express').Request} req
 * @returns {{ limit: number, offset: number, page: number }}
 */
function parsePagination(req) {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build the pagination meta object to include in API responses.
 * @param {{ page: number, limit: number, total: number }} opts
 * @returns {object}
 */
function buildMeta({ page, limit, total }) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { parsePagination, buildMeta, DEFAULT_LIMIT, MAX_LIMIT };
