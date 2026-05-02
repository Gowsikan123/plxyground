/**
 * Extracts a human-readable message from axios errors or generic JS errors.
 */
export function extractError(err) {
  if (!err) return 'An unexpected error occurred';
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return 'An unexpected error occurred';
}

/**
 * Returns true if the error is a 401 Unauthorized response.
 */
export function isUnauthorized(err) {
  return err?.response?.status === 401;
}

/**
 * Returns true if the error is a 422 Unprocessable Entity (validation failure).
 */
export function isValidationError(err) {
  return err?.response?.status === 422;
}
