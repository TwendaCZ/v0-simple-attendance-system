"use client"

import { useState, useEffect, useRef } from "react"
import { UserReports } from "@/components/user-reports"
import type { User } from "@/lib/types"
import { logAllData, forceRefreshData } from "@/lib/data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { AdminLoginModal } from "@/components/admin-login-modal"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { getAutoRefreshSetting } from "@/lib/settings"

// Interval automatického obnovování v milisekundách (5 minut)
const AUTO_REFRESH_INTERVAL = 300000

export default function ReportsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, any[]>>({})
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)

  // Ref pro interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Načtení stavu admin z localStorage při načtení komponenty
  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminState = localStorage.getItem("attendance-admin")
      setIsAdmin(adminState === "true")
    }
  }, [])

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
      console.log("Reports data refreshed:", { users: loadedUsers, records })
    } catch (error) {
      console.error("Error refreshing reports data:", error)
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

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id)
    }
  }, [users, selectedUserId])

  // Funkce pro přihlášení admina
  const handleLoginSuccess = () => {
    setIsAdmin(true)
    localStorage.setItem("attendance-admin", "true")
    setShowLoginModal(false)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Reporty docházky</h1>
        <p className="text-center text-muted-foreground mb-4 sm:mb-6">Přehled docházky jednotlivých uživatelů</p>

        <div className="mb-4 flex justify-end items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Poslední aktualizace: {format(lastRefresh, "HH:mm:ss", { locale: cs })}
            <span className={`ml-2 ${autoRefresh ? "text-green-600" : "text-amber-600"}`}>
              ({autoRefresh ? "Automatické obnovování zapnuto" : "Automatické obnovování vypnuto"})
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
            {isAdmin ? (
              <Button asChild>
                <Link href="/settings">Přidat uživatele</Link>
              </Button>
            ) : (
              <Button onClick={() => setShowLoginModal(true)}>Přihlásit se jako administrátor</Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-wrap border-b">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      className={`px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                        selectedUserId === user.id
                          ? "bg-primary/10 text-primary border-b-2 border-primary"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedUserId && (
              <div className="mt-6">
                <UserReports
                  user={users.find((u) => u.id === selectedUserId)!}
                  attendanceRecords={attendanceRecords[selectedUserId] || []}
                  onDataChange={() => refreshData(true)}
                  isAdmin={isAdmin}
                  onAdminLogin={() => setShowLoginModal(true)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
