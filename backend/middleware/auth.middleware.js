const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "Authentication token is required"
            });
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                error: "Invalid authorization format"
            });
        }

        const token = parts[1];
        const secret = process.env.JWT_SECRET || "qveto_jwt_secret_dev";

        const decoded = jwt.verify(token, secret);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired authentication token"
        });
    }
}

module.exports = authenticateToken;
