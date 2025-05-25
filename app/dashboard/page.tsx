"use client"

import { useState, useEffect, useRef } from "react"
import { UsersGrid } from "@/components/users-grid"
import { AttendanceModal } from "@/components/attendance-modal"
import type { User } from "@/lib/types"
import { logAllData, forceRefreshData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock } from "lucide-react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { getAutoRefreshSetting } from "@/lib/settings"

// Interval automatického obnovování v milisekundách (5 minut)
const AUTO_REFRESH_INTERVAL = 300000

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, any[]>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)

  // Ref pro interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Načtení nastavení automatického obnovování
  useEffect(() => {
    const loadAutoRefreshSetting = async () => {
      try {
        const setting = await getAutoRefreshSetting()
        setAutoRefresh(setting)
      } catch (error) {
        console.error("Error loading auto refresh setting:", error)
      }
    }

    loadAutoRefreshSetting()
  }, [])

  // Funkce pro obnovení dat
  const refreshData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const { users: loadedUsers, records } = await forceRefreshData()
      setUsers(loadedUsers)
      setAttendanceRecords(records)
      setLastRefresh(new Date())
      console.log("Dashboard data refreshed:", { users: loadedUsers, records })
    } catch (error) {
      console.error("Error refreshing dashboard data:", error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Nastavení automatického obnovování
  useEffect(() => {
    // Počáteční načtení dat
    refreshData()
    logAllData()

    // Nastavení intervalu pro automatické obnovování (každých 5 minut)
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData(false) // Obnovení dat bez zobrazení indikátoru načítání
      }, AUTO_REFRESH_INTERVAL)
    }

    // Cleanup při unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh, refreshKey])

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
    // Obnovení dat po zavření modálního okna
    refreshData()
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h1 className="text-2xl font-bold mb-1 text-center">Docházkový systém</h1>
        <p className="text-center text-muted-foreground mb-4">Klikněte na uživatele pro zaznamenání docházky</p>

        <div className="mb-3 flex justify-end items-center">
          <div className="flex flex-wrap items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Poslední aktualizace: {format(lastRefresh, "HH:mm:ss", { locale: cs })}
            <span className={`ml-2 ${autoRefresh ? "text-green-600" : "text-amber-600"}`}>
              ({autoRefresh ? "Auto. obnovování" : "Bez auto. obnovování"})
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Zatím nejsou přidáni žádní uživatelé</p>
            <Button asChild>
              <Link href="/settings">Přidat uživatele</Link>
            </Button>
          </div>
        ) : (
          <UsersGrid users={users} attendanceRecords={attendanceRecords} onUserClick={handleUserClick} />
        )}
      </div>

      {selectedUser && <AttendanceModal user={selectedUser} isOpen={isModalOpen} onClose={closeModal} />}
    </div>
  )
}
