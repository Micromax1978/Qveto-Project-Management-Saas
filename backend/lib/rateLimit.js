// Small in-memory rate limiter (fixed window). Good enough for a single
// instance; use a shared store (e.g. Redis) if you run several instances.

function createLimiter({ windowMs, max, now = () => Date.now() }) {
    const hits = new Map();

    function consume(key) {
        const current = now();
        const entry = hits.get(key);

        if (!entry || entry.resetAt <= current) {
            hits.set(key, { count: 1, resetAt: current + windowMs });
            return { allowed: true, retryAfterMs: 0 };
        }

        entry.count += 1;

        if (entry.count > max) {
            return { allowed: false, retryAfterMs: entry.resetAt - current };
        }

        return { allowed: true, retryAfterMs: 0 };
    }

    function sweep() {
        const current = now();

        for (const [key, entry] of hits) {
            if (entry.resetAt <= current) {
                hits.delete(key);
            }
        }
    }

    return { consume, sweep, size: () => hits.size };
}

// Express middleware factory. Disabled when NODE_ENV=test unless
// RATE_LIMIT_FORCE=true (so the API tests are not throttled).
function rateLimit({ windowMs, max, keyFn }) {
    const limiter = createLimiter({ windowMs, max });
    const sweeper = setInterval(limiter.sweep, windowMs);
    sweeper.unref();

    return (req, res, next) => {
        if (process.env.NODE_ENV === "test" && process.env.RATE_LIMIT_FORCE !== "true") {
            return next();
        }

        const key = keyFn ? keyFn(req) : req.ip;
        const result = limiter.consume(key);

        if (!result.allowed) {
            res.set("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));

            return res.status(429).json({
                status: "ERROR",
                message: "Too many requests. Please try again later."
            });
        }

        return next();
    };
}

module.exports = { createLimiter, rateLimit };
