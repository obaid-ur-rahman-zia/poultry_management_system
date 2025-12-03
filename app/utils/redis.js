// // services/redisServiceUpstash.js
// import { Redis } from "@upstash/redis";

// class RedisService {
//   constructor() {
//     // create a REST client (connectionless)
//     this.client = new Redis({
//       url: process.env.UPSTASH_REDIS_REST_URL,
//       token: process.env.UPSTASH_REDIS_REST_TOKEN,
//     });
//     // Upstash client is connectionless, so no explicit connect/disconnect
//   }

//   async get(key) {
//     try {
//       return await this.client.get(key);
//     } catch (err) {
//       console.error("Upstash GET error:", err);
//       return null;
//     }
//   }

//   async set(key, value) {
//     try {
//       // Upstash set returns either OK or a result; mimic previous behavior
//       return await this.client.set(key, value);
//     } catch (err) {
//       console.error("Upstash SET error:", err);
//       return null;
//     }
//   }

//   async setex(key, ttl, value) {
//     try {
//       // Many SDKs support setex or set with EX option; Upstash provides set with options:
//       return await this.client.set(key, value, { ex: ttl });
//       // If your SDK version uses setex you can also call client.setex(key, ttl, value)
//     } catch (err) {
//       console.error("Upstash SETEX error:", err);
//       return null;
//     }
//   }

//   async del(key) {
//     try {
//       return await this.client.del(key);
//     } catch (err) {
//       console.error("Upstash DEL error:", err);
//       return null;
//     }
//   }

//   async exists(key) {
//     try {
//       // Upstash supports "exists" command
//       const res = await this.client.exists(key);
//       return res === 1;
//     } catch (err) {
//       console.error("Upstash EXISTS error:", err);
//       return false;
//     }
//   }

//   async flushAll() {
//     try {
//       // Be careful with flushall on managed DBs — some providers disallow or warn on it
//       return await this.client.flushall();
//     } catch (err) {
//       console.error("Upstash FLUSHALL error:", err);
//       return null;
//     }
//   }

//   // ping
//   async ping() {
//     try {
//       return await this.client.ping();
//     } catch (err) {
//       console.error("Upstash PING error:", err);
//       return null;
//     }
//   }
// }

// export default new RedisService();

//Local Cache

import { createClient } from "redis";

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        // Add other Redis configuration options as needed
        retry_unfulfilled_commands: true,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
        },
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
      });

      this.client.on("connect", () => {
        console.log("Connected to Redis");
      });

      this.client.on("disconnect", () => {
        console.log("Disconnected from Redis");
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      return this.client;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async set(key, value) {
    try {
      if (!this.isConnected) await this.connect();
      const str = typeof value === "string" ? value : JSON.stringify(value);
      return await this.client.set(key, str);
    } catch (err) {
      console.error("Redis SET error:", err);
      return null;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) await this.connect();
      const data = await this.client.get(key);
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (err) {
      console.error("Redis GET error:", err);
      return null;
    }
  }

  async setex(key, ttl, value) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.setEx(key, ttl, value);
    } catch (error) {
      console.error("Redis SETEX error:", error);
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.del(key);
    } catch (error) {
      console.error("Redis DEL error:", error);
      return null;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.exists(key);
    } catch (error) {
      console.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async flushAll() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.flushAll();
    } catch (error) {
      console.error("Redis FLUSHALL error:", error);
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.error("Redis disconnect error:", error);
    }
  }

  // Health check method
  async ping() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.ping();
    } catch (error) {
      console.error("Redis PING error:", error);
      return null;
    }
  }
}

export default new RedisService();
