const { getRedisClient } = require("../config/redis.config");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_SCAN_COUNT = 100;

function buildCacheKey(req, prefix) {
	const userId = req.user?._id?.toString?.() || "anonymous";
	const resource = `${req.method}:${req.originalUrl}`;
	return `cache:${prefix}:${userId}:${resource}`;
}

function getFromCache(prefix, ttlSeconds = DEFAULT_TTL_SECONDS) {
	return async function cacheGetMiddleware(req, res, next) {
		if (req.method !== "GET") {
			return next();
		}

		const logCtx = getLogContext(req);
		let redisClient;

		try {
			redisClient = getRedisClient();
		} catch (error) {
			logger.warn("Cache unavailable: redis client not initialized", {
				...logCtx,
				cachePrefix: prefix,
				error: getErrorMeta(error),
			});
			return next();
		}

		const cacheKey = buildCacheKey(req, prefix);

		try {
			const cachedValue = await redisClient.get(cacheKey);

			if (cachedValue) {
				logger.info("Cache hit", {
					...logCtx,
					cachePrefix: prefix,
					cacheKey,
				});

				res.set("x-cache", "HIT");
				return res.status(200).json(JSON.parse(cachedValue));
			}

			logger.debug("Cache miss", {
				...logCtx,
				cachePrefix: prefix,
				cacheKey,
			});

			const originalJson = res.json.bind(res);

			res.json = (body) => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					redisClient
						.setEx(cacheKey, ttlSeconds, JSON.stringify(body))
						.catch((error) => {
							logger.error("Cache set failed", {
								...logCtx,
								cachePrefix: prefix,
								cacheKey,
								error: getErrorMeta(error),
							});
						});
					res.set("x-cache", "MISS");
				}

				return originalJson(body);
			};

			return next();
		} catch (error) {
			logger.error("Cache read failed", {
				...logCtx,
				cachePrefix: prefix,
				cacheKey,
				error: getErrorMeta(error),
			});
			return next();
		}
	};
}

async function clearByPrefix(redisClient, keyPrefix, logCtx) {
	const matchPattern = `cache:${keyPrefix}:*`;
	const keysToDelete = [];

	for await (const key of redisClient.scanIterator({
		MATCH: matchPattern,
		COUNT: DEFAULT_SCAN_COUNT,
	})) {
		keysToDelete.push(key);
	}

	if (keysToDelete.length === 0) {
		logger.debug("Cache invalidation skipped: no keys found", {
			...logCtx,
			cachePrefix: keyPrefix,
		});
		return;
	}

	await redisClient.del(...keysToDelete);

	logger.info("Cache invalidation success", {
		...logCtx,
		cachePrefix: keyPrefix,
		deletedKeys: keysToDelete.length,
	});
}

function invalidateCache(prefixes = []) {
	return function cacheInvalidateMiddleware(req, res, next) {
		const logCtx = getLogContext(req);

		res.on("finish", async () => {
			if (res.statusCode < 200 || res.statusCode >= 300) {
				return;
			}

			let redisClient;
			try {
				redisClient = getRedisClient();
			} catch (error) {
				logger.warn("Cache invalidation skipped: redis unavailable", {
					...logCtx,
					prefixes,
					error: getErrorMeta(error),
				});
				return;
			}

			for (const prefix of prefixes) {
				try {
					await clearByPrefix(redisClient, prefix, logCtx);
				} catch (error) {
					logger.error("Cache invalidation failed", {
						...logCtx,
						cachePrefix: prefix,
						error: getErrorMeta(error),
					});
				}
			}
		});

		return next();
	};
}

module.exports = {
	getFromCache,
	invalidateCache,
};
