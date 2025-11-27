
// Enhanced Error Classes
export class ApiError extends Error {
  public statusCode: number;
  public data: null;
  public success: boolean;
  public errors: any[];
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      success: this.success,
      errors: this.errors,
      isOperational: this.isOperational,
      ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
    };
  }
}

// ✅ SPECIFIC ERROR CLASSES
export class ValidationError extends ApiError {
  constructor(message: string = "Validation failed", errors: any[] = []) {
    super(400, message, errors, true);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(404, message, [], true);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized access") {
    super(401, message, [], true);
    this.name = "UnauthorizedError";
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = "Internal server error") {
    super(500, message, [], false);
    this.name = "InternalServerError";
  }
}

export class PayPalApiError extends ApiError {
  public paypalDebugId?: string;

  constructor(
    message: string = "PayPal API error",
    paypalDebugId?: string,
    statusCode: number = 500
  ) {
    super(statusCode, message, [], true);
    this.name = "PayPalApiError";
    this.paypalDebugId = paypalDebugId;
  }
}
