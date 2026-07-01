export type FieldErrors = Record<string, string[]>;

/**
 * Structured HTTP error that carries a status code and optional field-level
 * validation errors.  The global error handler converts these to the
 * `{ message, errors? }` API shape defined in the shared package.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly errors?: FieldErrors;

  constructor(statusCode: number, message: string, errors?: FieldErrors) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  // ─── Convenience factories ────────────────────────────────────────────────

  static badRequest(message: string, errors?: FieldErrors): HttpError {
    return new HttpError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Forbidden'): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not found'): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message: string): HttpError {
    return new HttpError(409, message);
  }

  static internal(message = 'Internal server error'): HttpError {
    return new HttpError(500, message);
  }
}
