import type { User } from "@/lib/types"

export interface UsersGridProps {
  users: User[]
  attendanceRecords: Record<string, any[]>
  onUserClick: (user: User) => void
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
