// src/utils/ApiError.ts
class ApiError extends Error {
    public statusCode: number;
    public data: null;
    public success: boolean;
    public errors: any[];

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: any[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        // ✅ FIX: Check if captureStackTrace exists (Node.js environment)
        if (stack) {
            this.stack = stack;
        } else if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error().stack;
        }
    }
}

export { ApiError };