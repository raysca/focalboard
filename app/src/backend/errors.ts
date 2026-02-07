export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "bad request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "not found") {
    super(404, message);
  }
}

export class RequestEntityTooLargeError extends AppError {
  constructor(message = "request entity too large") {
    super(413, message);
  }
}

export class NotImplementedError extends AppError {
  constructor(message = "not implemented") {
    super(501, message);
  }
}
