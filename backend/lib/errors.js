// Error type used to return a specific HTTP status from anywhere in a request.
// The error middleware turns it into { status: "ERROR", message }.
class HttpError extends Error {
    constructor(statusCode, message, extra = {}) {
        super(message);
        this.name = "HttpError";
        this.statusCode = statusCode;
        this.extra = extra;
    }
}

module.exports = { HttpError };
