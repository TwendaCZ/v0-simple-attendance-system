"use client"

import { useState, useEffect } from "react"
import { format, parseISO, getMonth, getYear } from "date-fns"
import { cs } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EditReportModal } from "@/components/edit-report-modal"
import { AddReportModal } from "@/components/add-report-modal"
import { DeleteDayModal } from "@/components/delete-day-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/lib/types"
import { calculateWorkHours, calculateEarnings, groupRecordsByDay } from "@/lib/utils"
import { getRates, forceRefreshData } from "@/lib/data"
import { FileDown, RefreshCw, Lock } from "lucide-react"
import { generatePDF } from "@/lib/pdf-export"
import { UserReportsTable } from "@/components/user-reports-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserReportsProps {
  user: User
  attendanceRecords: any[]
  onDataChange?: () => void
  isAdmin: boolean
  onAdminLogin: () => void
}

export function UserReports({ user, attendanceRecords, onDataChange, isAdmin, onAdminLogin }: UserReportsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteDayModalOpen, setIsDeleteDayModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [records, setRecords] = useState<any[]>(attendanceRecords)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [rates, setRates] = useState<{ weekday: number; weekend: number }>({ weekday: 200, weekend: 250 })

  // Load rates
  useEffect(() => {
    const loadRates = async () => {
      try {
        const loadedRates = await getRates()
        setRates(loadedRates)
      } catch (error) {
        console.error("Error loading rates:", error)
      }
    }

    loadRates()
  }, [])

  // Update records when attendanceRecords prop changes or refreshKey changes
  useEffect(() => {
    setRecords(attendanceRecords)
    console.log("UserReports received new records:", attendanceRecords)
  }, [attendanceRecords, refreshKey])

  // Refresh records from Redis
  const refreshRecords = async () => {
    try {
      setLoading(true)
      const { records: allRecords } = await forceRefreshData()
      const userRecords = allRecords[user.id] || []
      setRecords(userRecords)
      console.log("UserReports refreshed records for user:", user.id, userRecords)

      if (onDataChange) {
        onDataChange()
      } else {
        setRefreshKey((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error refreshing user records:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter records by selected month
  const filteredRecords =
    selectedMonth === "all"
      ? records
      : records.filter((record) => {
          const date = parseISO(record.timestamp)
          const [year, month] = selectedMonth.split("-")
          return getYear(date) === Number.parseInt(year) && getMonth(date) === Number.parseInt(month) - 1
        })

  // Group records by day
  const recordsByDay = groupRecordsByDay(filteredRecords)

  // Sort days in descending order
  const sortedDays = Object.keys(recordsByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const handleEditRecord = (record: any) => {
    if (!isAdmin) {
      onAdminLogin()
      return
    }
    setSelectedRecord(record)
    setIsEditModalOpen(true)
  }

  const handleDeleteDay = (day: string) => {
    if (!isAdmin) {
      onAdminLogin()
      return
    }
    setSelectedDay(day)
    setIsDeleteDayModalOpen(true)
  }

  const handleEditClose = () => {
    setIsEditModalOpen(false)
    setSelectedRecord(null)
    refreshRecords()
  }

  const handleDeleteDayClose = () => {
    setIsDeleteDayModalOpen(false)
    setSelectedDay(null)
    refreshRecords()
  }

  const handleAddClose = () => {
    setIsAddModalOpen(false)
    refreshRecords()
  }

  const totalWorkHours = calculateWorkHours(filteredRecords)
  const totalEarnings = calculateEarnings(filteredRecords, rates)

  // Generate months for filter
  const months: { value: string; label: string }[] = []
  const currentDate = new Date()
  const currentYear = getYear(currentDate)
  const currentMonth = getMonth(currentDate)

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth - i, 1)
    const value = `${getYear(date)}-${(getMonth(date) + 1).toString().padStart(2, "0")}`
    const label = format(date, "MMMM yyyy", { locale: cs })
    months.push({ value, label })
  }

  const handleExportPDF = () => {
    setExportLoading(true)
    setTimeout(() => {
      try {
        generatePDF(user, filteredRecords, recordsByDay, totalWorkHours, totalEarnings)
      } catch (error) {
        console.error("Error generating PDF:", error)
      } finally {
        setExportLoading(false)
      }
    }, 100)
  }

  return (
    <TooltipProvider>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{totalWorkHours.toFixed(2)}</span> hodin
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{totalEarnings.toFixed(2)}</span> Kč
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={refreshRecords} disabled={loading}>
                  <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Obnovit data</TooltipContent>
            </Tooltip>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Vyberte měsíc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny záznamy</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleExportPDF} variant="outline" className="h-10" disabled={exportLoading}>
                  <FileDown className={`mr-2 h-5 w-5 ${exportLoading ? "animate-spin" : ""}`} />
                  {exportLoading ? "Generuji..." : "Export PDF"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportovat jako PDF</TooltipContent>
            </Tooltip>

            {isAdmin ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setIsAddModalOpen(true)} className="h-10">
                    Přidat záznam
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Přidat nový záznam docházky</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onAdminLogin} className="h-10">
                    <Lock className="mr-2 h-5 w-5" />
                    Administrace
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pro úpravy se přihlaste jako administrátor</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Načítání dat...</span>
                </div>
              ) : (
                <UserReportsTable
                  sortedDays={sortedDays}
                  recordsByDay={recordsByDay}
                  onEditRecord={handleEditRecord}
                  onDeleteDay={handleDeleteDay}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {selectedRecord && isAdmin && (
          <EditReportModal
            record={selectedRecord}
            isOpen={isEditModalOpen}
            onClose={handleEditClose}
            userId={user.id}
          />
        )}

        {selectedDay && isAdmin && (
          <DeleteDayModal
            day={selectedDay}
            isOpen={isDeleteDayModalOpen}
            onClose={handleDeleteDayClose}
            userId={user.id}
          />
        )}

        {isAdmin && <AddReportModal isOpen={isAddModalOpen} onClose={handleAddClose} userId={user.id} />}
      </div>
    </TooltipProvider>
  )
}
