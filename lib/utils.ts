import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, format, isWeekend, differenceInMinutes } from "date-fns"
import type { Rates, AttendanceRecord } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserStatus(userId: string, attendanceRecords: Record<string, any[]>): string {
  const records = attendanceRecords[userId] || []

  if (records.length === 0) return "Nepřítomen"

  // Sort records by timestamp
  const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Get the most recent record
  const lastRecord = sortedRecords[0]

  if (
    lastRecord.type === "arrival" ||
    (lastRecord.type === "break" && sortedRecords.length > 1 && sortedRecords[1].type === "arrival")
  ) {
    return "Přítomen"
  } else {
    return "Nepřítomen"
  }
}

export function calculateWorkHours(records: AttendanceRecord[]): number {
  if (!records || records.length === 0) return 0

  // Sort records by timestamp
  const sortedRecords = [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  let totalMinutes = 0
  let lastArrival: Date | null = null
  let onBreak = false

  for (const record of sortedRecords) {
    const timestamp = parseISO(record.timestamp)

    if (record.type === "arrival") {
      lastArrival = timestamp
      onBreak = false
    } else if (record.type === "departure" && lastArrival) {
      if (!onBreak) {
        totalMinutes += differenceInMinutes(timestamp, lastArrival)
      }
      lastArrival = null
    } else if (record.type === "break") {
      if (lastArrival && !onBreak) {
        totalMinutes += differenceInMinutes(timestamp, lastArrival)
        onBreak = true
      } else if (onBreak) {
        lastArrival = timestamp
        onBreak = false
      }
    }
  }

  return totalMinutes / 60
}

export function calculateEarnings(records: AttendanceRecord[], rates: Rates): number {
  if (!records || records.length === 0) return 0

  // Group records by day
  const recordsByDay = groupRecordsByDay(records)

  let totalEarnings = 0

  // Calculate earnings for each day
  Object.entries(recordsByDay).forEach(([date, dayRecords]) => {
    const isWeekendDay = isWeekend(new Date(date))
    const rate = isWeekendDay ? rates.weekend : rates.weekday

    const hoursWorked = calculateWorkHours(dayRecords)
    totalEarnings += hoursWorked * rate
  })

  return totalEarnings
}

export function groupRecordsByDay(records: AttendanceRecord[]): Record<string, AttendanceRecord[]> {
  const recordsByDay: Record<string, AttendanceRecord[]> = {}

  records.forEach((record) => {
    const date = format(parseISO(record.timestamp), "yyyy-MM-dd")
    if (!recordsByDay[date]) {
      recordsByDay[date] = []
    }
    recordsByDay[date].push(record)
  })

  return recordsByDay
}
