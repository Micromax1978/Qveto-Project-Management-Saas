// Pure helpers used by the analytics endpoints. Dependency-free for unit testing.

// Percentage rounded to one decimal place. 0 when there is nothing to divide by.
function completionRate(done, total) {
    if (!total) {
        return 0;
    }

    return Math.round((done / total) * 1000) / 10;
}

// Turn grouped rows into a map that contains every key (missing keys = 0).
function zeroFill(keys, rows, keyOf, countOf) {
    const result = {};

    for (const key of keys) {
        result[key] = 0;
    }

    for (const row of rows) {
        const key = keyOf(row);
        result[key] = (result[key] || 0) + countOf(row);
    }

    return result;
}

function dayKey(date) {
    return new Date(date).toISOString().slice(0, 10);
}

// Count dates per UTC day for the last `days` days (including today),
// oldest first, with zeros for empty days.
function bucketByDay(dates, days, now = new Date()) {
    const buckets = [];
    const index = new Map();

    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const day = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - offset
        ));
        const key = dayKey(day);
        const bucket = { date: key, count: 0 };

        buckets.push(bucket);
        index.set(key, bucket);
    }

    for (const date of dates) {
        const bucket = index.get(dayKey(date));

        if (bucket) {
            bucket.count += 1;
        }
    }

    return buckets;
}

function startOfWindow(days, now = new Date()) {
    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - (days - 1)
    ));
}

module.exports = { completionRate, zeroFill, bucketByDay, startOfWindow, dayKey };
