const Redis = require("ioredis");

const redis = new Redis({
    // Either you can simply provide the URL or specify host, port, username, and password separately. 
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: "default",
    password: process.env.REDIS_PASSWORD,
    //   URL doesn't start with "rediss://" so TLS is not enabled by default, but Redis Labs requires it.
    //   tls: {},  // TLS for secure connection, default requirement by redis
});

redis.on("connect", () => {
    console.log("Redis connected (Cloud)");
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

module.exports = redis;