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
    this.isEnabled = process.env.REDIS_ENABLED !== "false"; // Allow disabling Redis via env
    this.connectionAttempted = false;
    this.connectionFailed = false;
    this.errorLogged = false; // Track if we've already logged the error to avoid spam
  }

  async connect() {
    // If Redis is disabled, skip connection
    if (!this.isEnabled) {
      return null;
    }

    // If already connected, return client
    if (this.isConnected && this.client) {
      return this.client;
    }

    // If connection already failed, don't retry immediately
    if (this.connectionFailed) {
      return null;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.connectionAttempted) {
      return null;
    }

    this.connectionAttempted = true;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        // Add other Redis configuration options as needed
        retry_unfulfilled_commands: false, // Disable retry to prevent repeated errors
        socket: {
          connectTimeout: 5000, // 5 second timeout
          reconnectStrategy: false, // Disable automatic reconnection to prevent error spam
        },
      });

      this.client.on("error", (err) => {
        // Only log error once to avoid spam
        if (!this.errorLogged) {
          console.warn("Redis Client Error (Redis is optional, continuing without cache):", err.message || err.code);
          this.errorLogged = true;
        }
        this.isConnected = false;
        this.connectionFailed = true;
      });

      this.client.on("connect", () => {
        console.log("✓ Connected to Redis");
        this.isConnected = true;
        this.connectionFailed = false;
        this.errorLogged = false;
      });

      this.client.on("disconnect", () => {
        this.isConnected = false;
      });

      // Set connection timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 5000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = true;
      this.connectionFailed = false;
      this.connectionAttempted = false;
      this.errorLogged = false; // Reset error logged flag on success
      return this.client;
    } catch (error) {
      // Clean up failed client
      if (this.client) {
        try {
          // Remove all event listeners
          this.client.removeAllListeners();
          // Try to disconnect if client exists
          if (this.client.isOpen) {
            await this.client.quit().catch(() => {});
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.client = null;
      }

      // Only log once to avoid spam
      if (!this.errorLogged) {
        console.warn("⚠ Redis connection failed (Redis is optional, continuing without cache)");
        console.warn("   Error:", error.message || error.code || "Connection refused");
        console.warn("   To enable Redis cache, ensure Redis server is running on", process.env.REDIS_URL || "redis://localhost:6379");
        console.warn("   Or set REDIS_ENABLED=false in .env to disable Redis completely");
        this.errorLogged = true;
      }
      this.isConnected = false;
      this.connectionFailed = true;
      this.connectionAttempted = false;
      return null; // Return null instead of throwing
    }
  }

  async set(key, value) {
    try {
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return null; // Gracefully fail if Redis is not available
      }
      const str = typeof value === "string" ? value : JSON.stringify(value);
      return await this.client.set(key, str);
    } catch (err) {
      // Silently fail - Redis is optional
      return null;
    }
  }

  async get(key) {
    try {
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return null; // Gracefully fail if Redis is not available
      }
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (err) {
      // Silently fail - Redis is optional
      return null;
    }
  }

  async setex(key, ttl, value) {
    try {
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return null; // Gracefully fail if Redis is not available
      }
      const str = typeof value === "string" ? value : JSON.stringify(value);
      return await this.client.setEx(key, ttl, str);
    } catch (error) {
      // Silently fail - Redis is optional
      return null;
    }
  }

  async del(key) {
    try {
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return null; // Gracefully fail if Redis is not available
      }
      return await this.client.del(key);
    } catch (error) {
      // Silently fail - Redis is optional
      return null;
    }
  }

  async exists(key) {
    try {
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return false; // Gracefully fail if Redis is not available
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      // Silently fail - Redis is optional
      return false;
    }
  }

  async flushAll() {
    try {
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return null; // Gracefully fail if Redis is not available
      }
      return await this.client.flushAll();
    } catch (error) {
      // Silently fail - Redis is optional
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
      const client = await this.connect();
      if (!client || !this.isConnected) {
        return null;
      }
      return await this.client.ping();
    } catch (error) {
      return null;
    }
  }

  // Method to manually reset connection state (useful for retrying)
  resetConnection() {
    this.connectionAttempted = false;
    this.connectionFailed = false;
    this.errorLogged = false;
  }

  // Check if Redis is available
  isAvailable() {
    return this.isEnabled && this.isConnected && this.client !== null;
  }
}

export default new RedisService();
