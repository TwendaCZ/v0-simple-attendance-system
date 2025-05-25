import redis from "./redis-client"
import type { User, Rates, AttendanceRecord } from "./types"

// Initialize Redis connection
const USERS_KEY = "attendance-users"
const RECORDS_KEY = "attendance-records"
const RATES_KEY = "attendance-rates"

// Debug flag
const DEBUG = true

function log(...args: any[]) {
  if (DEBUG) {
    console.log("[REDIS]", ...args)
  }
}

// Users
export async function getRedisUsers(): Promise<User[]> {
  try {
    const users = await redis.get<User[]>(USERS_KEY)
    log("Loaded users:", users)
    return users || []
  } catch (error) {
    console.error("Error getting users from Redis:", error)
    throw error
  }
}

export async function saveRedisUsers(users: User[]): Promise<void> {
  try {
    await redis.set(USERS_KEY, users)
    log("Saved users:", users)
  } catch (error) {
    console.error("Error saving users to Redis:", error)
    throw error
  }
}

// Attendance Records
export async function getRedisAttendanceRecords(): Promise<Record<string, AttendanceRecord[]>> {
  try {
    const records = await redis.get<Record<string, AttendanceRecord[]>>(RECORDS_KEY)
    log("Loaded attendance records:", records)
    return records || {}
  } catch (error) {
    console.error("Error getting attendance records from Redis:", error)
    throw error
  }
}

export async function saveRedisAttendanceRecords(records: Record<string, AttendanceRecord[]>): Promise<void> {
  try {
    await redis.set(RECORDS_KEY, records)
    log("Saved attendance records:", records)
  } catch (error) {
    console.error("Error saving attendance records to Redis:", error)
    throw error
  }
}

// Rates
export async function getRedisRates(): Promise<Rates> {
  try {
    const rates = await redis.get<Rates>(RATES_KEY)
    log("Loaded rates:", rates)
    return rates || { weekday: 200, weekend: 250 }
  } catch (error) {
    console.error("Error getting rates from Redis:", error)
    throw error
  }
}

export async function saveRedisRates(rates: Rates): Promise<void> {
  try {
    await redis.set(RATES_KEY, rates)
    log("Saved rates:", rates)
  } catch (error) {
    console.error("Error saving rates to Redis:", error)
    throw error
  }
}

// Debug function to clear all data
export async function clearRedisData(): Promise<void> {
  try {
    await redis.del(USERS_KEY)
    await redis.del(RECORDS_KEY)
    await redis.del(RATES_KEY)
    log("All Redis data cleared")
  } catch (error) {
    console.error("Error clearing Redis data:", error)
    throw error
  }
}

// Debug function to log all data
export async function logRedisData(): Promise<void> {
  try {
    log("===== CURRENT REDIS DATA STATE =====")
    log("Users:", await redis.get(USERS_KEY))
    log("Attendance Records:", await redis.get(RECORDS_KEY))
    log("Rates:", await redis.get(RATES_KEY))
    log("===================================")
  } catch (error) {
    console.error("Error logging Redis data:", error)
    throw error
  }
}

// Migration function to move data from localStorage to Redis
export async function migrateLocalStorageToRedis(): Promise<void> {
  try {
    if (typeof window === "undefined") return

    // Migrate users
    const localUsers = localStorage.getItem("attendance-users")
    if (localUsers) {
      const users = JSON.parse(localUsers)
      await redis.set(USERS_KEY, users)
      log("Migrated users from localStorage to Redis")
    }

    // Migrate attendance records
    const localRecords = localStorage.getItem("attendance-records")
    if (localRecords) {
      const records = JSON.parse(localRecords)
      await redis.set(RECORDS_KEY, records)
      log("Migrated attendance records from localStorage to Redis")
    }

    // Migrate rates
    const localRates = localStorage.getItem("attendance-rates")
    if (localRates) {
      const rates = JSON.parse(localRates)
      await redis.set(RATES_KEY, rates)
      log("Migrated rates from localStorage to Redis")
    }

    log("Migration from localStorage to Redis completed")
  } catch (error) {
    console.error("Error migrating data from localStorage to Redis:", error)
    throw error
  }
}
