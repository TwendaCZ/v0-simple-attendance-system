import type { User, Rates, AttendanceRecord } from "./types"
import redis from "./redis-client"

// Debug flag - set to true to enable verbose logging
const DEBUG = true

function log(...args: any[]) {
  if (DEBUG) {
    console.log("[DATA]", ...args)
  }
}

// Keys for Redis
const USERS_KEY = "attendance-users"
const RECORDS_KEY = "attendance-records"
const RATES_KEY = "attendance-rates"

// Users
export async function getUsers(): Promise<User[]> {
  try {
    const users = await redis.get<User[]>(USERS_KEY)
    log("Loaded users:", users)
    return users || []
  } catch (error) {
    console.error("Error getting users:", error)
    throw new Error("Nepodařilo se načíst uživatele z Redis")
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  try {
    log("Saving users:", users)
    await redis.set(USERS_KEY, users)
  } catch (error) {
    console.error("Error saving users:", error)
    throw new Error("Nepodařilo se uložit uživatele do Redis")
  }
}

// Attendance Records
export async function getAttendanceRecords(): Promise<Record<string, AttendanceRecord[]>> {
  try {
    const records = await redis.get<Record<string, AttendanceRecord[]>>(RECORDS_KEY)
    log("Loaded attendance records:", records)
    return records || {}
  } catch (error) {
    console.error("Error getting attendance records:", error)
    throw new Error("Nepodařilo se načíst záznamy docházky z Redis")
  }
}

export async function saveAttendanceRecords(records: Record<string, AttendanceRecord[]>): Promise<void> {
  try {
    log("Saving attendance records:", records)
    await redis.set(RECORDS_KEY, records)
  } catch (error) {
    console.error("Error saving attendance records:", error)
    throw new Error("Nepodařilo se uložit záznamy docházky do Redis")
  }
}

export async function addAttendanceRecord(userId: string, record: AttendanceRecord): Promise<boolean> {
  try {
    log("Adding record for user:", userId, "Record:", record)

    // Get current records
    const records = await getAttendanceRecords()

    // Initialize user records if they don't exist
    if (!records[userId]) {
      records[userId] = []
    }

    // Add the new record
    records[userId].push(record)

    // Save the updated records
    await saveAttendanceRecords(records)

    // Verify the record was saved
    const updatedRecords = await getAttendanceRecords()
    const userRecords = updatedRecords[userId] || []
    const found = userRecords.some((r) => r.timestamp === record.timestamp && r.type === record.type)

    if (found) {
      log("Record successfully saved and verified")
      return true
    } else {
      console.error("Failed to save record! Record not found after save operation")
      return false
    }
  } catch (error) {
    console.error("Error adding attendance record:", error)
    throw new Error("Nepodařilo se přidat záznam docházky do Redis")
  }
}

export async function updateAttendanceRecord(
  userId: string,
  oldRecord: AttendanceRecord,
  newRecord: AttendanceRecord,
): Promise<boolean> {
  try {
    log("Updating record for user:", userId, "Old record:", oldRecord, "New record:", newRecord)

    const records = await getAttendanceRecords()

    if (!records[userId]) {
      console.warn("No records found for user:", userId)
      return false
    }

    // Find the exact record by comparing timestamp and type
    const index = records[userId].findIndex((r) => r.timestamp === oldRecord.timestamp && r.type === oldRecord.type)

    if (index !== -1) {
      records[userId][index] = newRecord
      await saveAttendanceRecords(records)
      log("Updated record at index", index, "for user:", userId)
      return true
    } else {
      console.warn("Record not found for update:", oldRecord)
      return false
    }
  } catch (error) {
    console.error("Error updating attendance record:", error)
    throw new Error("Nepodařilo se aktualizovat záznam docházky v Redis")
  }
}

export async function deleteAttendanceRecord(userId: string, record: AttendanceRecord): Promise<boolean> {
  try {
    log("Deleting record for user:", userId, "Record:", record)

    const records = await getAttendanceRecords()

    if (!records[userId]) {
      console.warn("No records found for user:", userId)
      return false
    }

    // Find the exact record by comparing timestamp and type
    const initialLength = records[userId].length
    records[userId] = records[userId].filter((r) => !(r.timestamp === record.timestamp && r.type === record.type))

    if (records[userId].length < initialLength) {
      await saveAttendanceRecords(records)
      log("Deleted record for user:", userId)
      return true
    } else {
      console.warn("Record not found for deletion:", record)
      return false
    }
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    throw new Error("Nepodařilo se smazat záznam docházky z Redis")
  }
}

export async function deleteDayRecords(userId: string, day: string): Promise<boolean> {
  try {
    log("Deleting day records for user:", userId, "Day:", day)

    const records = await getAttendanceRecords()

    if (!records[userId]) {
      console.warn("No records found for user:", userId)
      return false
    }

    // Filter out all records for the specified day
    const initialLength = records[userId].length
    records[userId] = records[userId].filter((record) => {
      const recordDate = new Date(record.timestamp)
      const recordDay = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, "0")}-${String(
        recordDate.getDate(),
      ).padStart(2, "0")}`
      return recordDay !== day
    })

    if (records[userId].length < initialLength) {
      await saveAttendanceRecords(records)
      log("Deleted day records for user:", userId, "day:", day)
      return true
    } else {
      console.warn("No records found for day:", day)
      return false
    }
  } catch (error) {
    console.error("Error deleting day records:", error)
    throw new Error("Nepodařilo se smazat záznamy dne z Redis")
  }
}

// Rates
export async function getRates(): Promise<Rates> {
  try {
    const rates = await redis.get<Rates>(RATES_KEY)
    log("Loaded rates:", rates)
    return rates || { weekday: 200, weekend: 250 }
  } catch (error) {
    console.error("Error getting rates:", error)
    throw new Error("Nepodařilo se načíst sazby z Redis")
  }
}

export async function saveRates(rates: Rates): Promise<void> {
  try {
    log("Saving rates:", rates)
    await redis.set(RATES_KEY, rates)
  } catch (error) {
    console.error("Error saving rates:", error)
    throw new Error("Nepodařilo se uložit sazby do Redis")
  }
}

// Debug function to clear all data
export async function clearAllData(): Promise<void> {
  try {
    await redis.del(USERS_KEY)
    await redis.del(RECORDS_KEY)
    await redis.del(RATES_KEY)
    log("All data cleared")
  } catch (error) {
    console.error("Error clearing data:", error)
    throw new Error("Nepodařilo se smazat data z Redis")
  }
}

// Debug function to log all data
export async function logAllData(): Promise<void> {
  try {
    log("===== CURRENT DATA STATE =====")
    log("Users:", await redis.get(USERS_KEY))
    log("Attendance Records:", await redis.get(RECORDS_KEY))
    log("Rates:", await redis.get(RATES_KEY))
    log("=============================")
  } catch (error) {
    console.error("Error logging data:", error)
    throw new Error("Nepodařilo se načíst data z Redis pro logování")
  }
}

// Force refresh all data from Redis
export async function forceRefreshData(): Promise<Record<string, any>> {
  try {
    const users = await getUsers()
    const records = await getAttendanceRecords()
    const rates = await getRates()

    log("Force refreshed all data")

    return { users, records, rates }
  } catch (error) {
    console.error("Error force refreshing data:", error)
    throw new Error("Nepodařilo se obnovit data z Redis")
  }
}

// Migration function to move data from localStorage to Redis
export async function migrateLocalStorageToRedis(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false

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
    return true
  } catch (error) {
    console.error("Error migrating data from localStorage to Redis:", error)
    return false
  }
}
