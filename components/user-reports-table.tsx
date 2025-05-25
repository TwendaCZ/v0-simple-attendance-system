"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { cs } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Trash2, Info, Lock } from "lucide-react"
import type { AttendanceRecord } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserReportsTableProps {
  sortedDays: string[]
  recordsByDay: Record<string, AttendanceRecord[]>
  onEditRecord: (record: AttendanceRecord) => void
  onDeleteDay: (day: string) => void
  isAdmin: boolean
}

export function UserReportsTable({
  sortedDays,
  recordsByDay,
  onEditRecord,
  onDeleteDay,
  isAdmin,
}: UserReportsTableProps) {
  const [showDetailsDay, setShowDetailsDay] = useState<string | null>(null)

  // Funkce pro zobrazení detailů úprav
  const showDetails = (day: string) => {
    setShowDetailsDay(day)
  }

  return (
    <>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[800px] px-4 sm:px-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Datum</th>
                <th className="text-left p-3 font-medium">Příchod</th>
                <th className="text-left p-3 font-medium">Odchod</th>
                <th className="text-left p-3 font-medium">Pauza</th>
                <th className="text-left p-3 font-medium">Poznámka</th>
                <th className="text-right p-3 font-medium">Akce</th>
              </tr>
            </thead>
            <tbody>
              {sortedDays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-muted-foreground">
                    Žádné záznamy pro vybrané období
                  </td>
                </tr>
              ) : (
                sortedDays.map((day) => {
                  const dayRecords = recordsByDay[day]
                  const formattedDate = format(new Date(day), "d. MMMM yyyy", { locale: cs })

                  // Find arrival, departure and break records
                  const arrivals = dayRecords
                    .filter((r) => r.type === "arrival")
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                  const departures = dayRecords
                    .filter((r) => r.type === "departure")
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                  const breaks = dayRecords
                    .filter((r) => r.type === "break")
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                  // Find special records (vacation, sick)
                  const specials = dayRecords.filter((r) => r.type === "vacation" || r.type === "sick")

                  // Check if any records were modified manually
                  const customRecords = dayRecords.filter((r) => r.isCustom)
                  const hasCustom = customRecords.length > 0
                  const hasSpecial = specials.length > 0

                  let specialNote = ""
                  if (hasSpecial) {
                    const specialTypes = specials.map((r) =>
                      r.type === "vacation" ? "Dovolená" : r.type === "sick" ? "Nemoc" : "",
                    )
                    specialNote = specialTypes.join(", ")
                  }

                  return (
                    <tr key={day} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{formattedDate}</td>
                      <td className="p-3">
                        {arrivals.map((r, i) => (
                          <div key={i} className="mb-1 last:mb-0">
                            {format(parseISO(r.timestamp), "HH:mm", { locale: cs })}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                                onClick={() => onEditRecord(r)}
                              >
                                <span className="sr-only">Upravit</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="p-3">
                        {departures.map((r, i) => (
                          <div key={i} className="mb-1 last:mb-0">
                            {format(parseISO(r.timestamp), "HH:mm", { locale: cs })}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                                onClick={() => onEditRecord(r)}
                              >
                                <span className="sr-only">Upravit</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="p-3">
                        {breaks.map((r, i) => (
                          <div key={i} className="mb-1 last:mb-0">
                            {format(parseISO(r.timestamp), "HH:mm", { locale: cs })}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                                onClick={() => onEditRecord(r)}
                              >
                                <span className="sr-only">Upravit</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {hasCustom && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 hover:text-amber-900 mr-1"
                            onClick={() => showDetails(day)}
                          >
                            <Info className="h-3 w-3 mr-1" />
                            Upraveno ručně
                          </Button>
                        )}
                        {specialNote && (
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 ml-1">
                            {specialNote}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {isAdmin ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Set the first record of the day to be edited
                                  if (dayRecords.length > 0) {
                                    onEditRecord(dayRecords[0])
                                  }
                                }}
                              >
                                Upravit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={() => onDeleteDay(day)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => onEditRecord(dayRecords[0])}>
                              <Lock className="h-4 w-4 mr-1" />
                              Upravit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog pro zobrazení detailů úprav */}
      {showDetailsDay && (
        <Dialog open={!!showDetailsDay} onOpenChange={() => setShowDetailsDay(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Detaily ručních úprav - {format(new Date(showDetailsDay), "d. MMMM yyyy", { locale: cs })}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                {recordsByDay[showDetailsDay]
                  .filter((r) => r.isCustom)
                  .map((record, index) => (
                    <div key={index} className="p-3 bg-muted rounded-md">
                      <div className="font-medium">
                        {getTypeLabel(record.type)} - {format(parseISO(record.timestamp), "HH:mm", { locale: cs })}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {record.changeLog || "Upraveno ručně (bez detailů)"}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Pomocná funkce pro získání českého názvu typu záznamu
function getTypeLabel(recordType: string): string {
  switch (recordType) {
    case "arrival":
      return "Příchod"
    case "departure":
      return "Odchod"
    case "break":
      return "Pauza"
    case "vacation":
      return "Dovolená"
    case "sick":
      return "Nemoc"
    default:
      return recordType
  }
}
