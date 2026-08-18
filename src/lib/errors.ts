export class HttpError extends Error {
  readonly status: number;
  readonly expose: boolean;

  constructor(status: number, message: string, options?: { expose?: boolean }) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.expose = options?.expose ?? status < 500;
  }
}

export function unauthorized(message = "Authentication required."): HttpError {
  return new HttpError(401, message);
}

export function forbidden(message = "Administrator access required."): HttpError {
  return new HttpError(403, message);
}

export function notFound(message = "Not found."): HttpError {
  return new HttpError(404, message);
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message);
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

export function publicErrorMessage(error: unknown): string {
  if (error instanceof HttpError && error.expose) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
