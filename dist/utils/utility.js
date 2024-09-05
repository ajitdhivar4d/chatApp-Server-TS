class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent Error constructor with the message
        this.statusCode = statusCode; // Set the statusCode property
        // Set the prototype explicitly to maintain the correct prototype chain
        Object.setPrototypeOf(this, ErrorHandler.prototype);
        // Optional: Capture stack trace (useful in V8 environments like Node.js)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export { ErrorHandler };
