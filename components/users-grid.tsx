"use client"

import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { getUserStatus } from "@/lib/utils"
import type { User } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { cs } from "date-fns/locale"

interface UsersGridProps {
  users: User[]
  attendanceRecords: Record<string, any[]>
  onUserClick: (user: User) => void
}

export function UsersGrid({ users, attendanceRecords, onUserClick }: UsersGridProps) {
  // Function to get the most recent arrival time
  const getLastArrivalTime = (userId: string): string | null => {
    const records = attendanceRecords[userId] || []
    if (records.length === 0) return null

    // Sort records by timestamp (newest first)
    const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Find the most recent arrival
    const lastArrival = sortedRecords.find((r) => r.type === "arrival")

    if (!lastArrival) return null

    return format(parseISO(lastArrival.timestamp), "HH:mm", { locale: cs })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {users.map((user) => {
        const status = getUserStatus(user.id, attendanceRecords)
        const isPresent = status === "Přítomen"
        const arrivalTime = isPresent ? getLastArrivalTime(user.id) : null

        return (
          <Card
            key={user.id}
            className={`cursor-pointer hover:shadow-lg transition-all ${
              isPresent ? "border-green-500 shadow-md" : "border-gray-200"
            }`}
            onClick={() => onUserClick(user)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center min-h-[160px]">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-lg font-bold mb-2 text-center">{user.name}</div>
              <div
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  isPresent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {status}
              </div>
              {isPresent && arrivalTime && <div className="mt-2 text-sm text-muted-foreground">Od {arrivalTime}</div>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
