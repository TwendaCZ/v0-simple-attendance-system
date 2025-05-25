"use client"

import { useEffect } from "react"

import { useState } from "react"
import { format, addDays } from "date-fns"
import { cs } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Clock } from "@/components/ui/clock"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { DateRange } from "react-day-picker"
import type { User, AttendanceRecord } from "@/lib/types"
import { addAttendanceRecord, getAttendanceRecords, logAllData } from "@/lib/data"
import { getUserStatus } from "@/lib/utils"
import { CalendarIcon, Clock3, Umbrella, Thermometer } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AttendanceModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

export function AttendanceModal({ user, isOpen, onClose }: AttendanceModalProps) {
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date())
  const [customTime, setCustomTime] = useState<string>("12:00")
  const [showCustom, setShowCustom] = useState(false)
  const [customType, setCustomType] = useState<"arrival" | "departure" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showSpecial, setShowSpecial] = useState(false)
  const [specialType, setSpecialType] = useState<"vacation" | "sick" | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  })

  const handleAction = async (type: "arrival" | "departure" | "break") => {
    console.log("Handling action:", type, "for user:", user.id)
    setMessage(null)
    setLoading(true)

    try {
      const record: AttendanceRecord = {
        type,
        timestamp: new Date().toISOString(),
      }

      const success = await addAttendanceRecord(user.id, record)

      if (success) {
        setMessage(`Záznam typu "${type}" byl úspěšně uložen.`)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage("Chyba: Záznam nebyl uložen! Zkontrolujte konzoli prohlížeče.")
        console.error("Failed to save record! Record not found after save operation")
      }

      logAllData() // Debug: log all data after adding record
    } catch (error) {
      console.error("Error in handleAction:", error)
      setMessage("Došlo k chybě při ukládání záznamu.")
    } finally {
      setLoading(false)
    }
  }

  const handleCustomAction = async () => {
    if (!customDate || !customType) return
    setMessage(null)
    setLoading(true)

    try {
      const [hours, minutes] = customTime.split(":").map(Number)
      const timestamp = new Date(customDate)
      timestamp.setHours(hours, minutes, 0, 0)

      const record: AttendanceRecord = {
        type: customType,
        timestamp: timestamp.toISOString(),
        isCustom: true,
      }

      const success = await addAttendanceRecord(user.id, record)

      if (success) {
        setMessage(`Vlastní záznam typu "${customType}" byl úspěšně uložen.`)
        setTimeout(() => {
          setShowCustom(false)
          onClose()
        }, 1500)
      } else {
        setMessage("Chyba: Vlastní záznam nebyl uložen! Zkontrolujte konzoli prohlížeče.")
        console.error("Failed to save custom record! Record not found after save operation")
      }

      logAllData()
    } catch (error) {
      console.error("Error in handleCustomAction:", error)
      setMessage("Došlo k chybě při ukládání vlastního záznamu.")
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialAction = async () => {
    if (!dateRange || !dateRange.from || !specialType) return
    setMessage(null)
    setLoading(true)

    try {
      // For each day in the range, add a record
      const currentDate = new Date(dateRange.from)
      const endDate = dateRange.to || dateRange.from
      let recordsAdded = 0
      let allSuccessful = true

      while (currentDate <= endDate) {
        const record: AttendanceRecord = {
          type: specialType,
          timestamp: new Date(currentDate).toISOString(),
          isSpecial: true,
          allDay: true,
        }

        const success = await addAttendanceRecord(user.id, record)
        if (success) {
          recordsAdded++
        } else {
          allSuccessful = false
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (allSuccessful) {
        setMessage(`Úspěšně přidáno ${recordsAdded} záznamů typu "${specialType}".`)
        setTimeout(() => {
          setShowSpecial(false)
          onClose()
        }, 1500)
      } else {
        setMessage(`Přidáno ${recordsAdded} záznamů, ale některé se nepodařilo uložit.`)
      }

      logAllData()
    } catch (error) {
      console.error("Error in handleSpecialAction:", error)
      setMessage("Došlo k chybě při ukládání speciálních záznamů.")
    } finally {
      setLoading(false)
    }
  }

  const showCustomForm = (type: "arrival" | "departure") => {
    setCustomType(type)
    setShowCustom(true)
    setShowSpecial(false)
    setMessage(null)
  }

  const showSpecialForm = (type: "vacation" | "sick") => {
    setSpecialType(type)
    setShowSpecial(true)
    setShowCustom(false)
    setMessage(null)
  }

  // Check if user is present - this is now async
  const [userStatus, setUserStatus] = useState<string>("Načítání...")
  const [isPresent, setIsPresent] = useState<boolean>(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const records = await getAttendanceRecords()
        const status = getUserStatus(user.id, records)
        setUserStatus(status)
        setIsPresent(status === "Přítomen")
      } catch (error) {
        console.error("Error checking user status:", error)
        setUserStatus("Chyba")
        setIsPresent(false)
      }
    }

    if (isOpen) {
      checkUserStatus()
    }
  }, [isOpen, user.id])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{user.name} - Docházka</DialogTitle>
        </DialogHeader>

        {message && (
          <Alert className={message.includes("Chyba") ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Ukládání...</span>
          </div>
        ) : !showCustom && !showSpecial ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-28 text-xl py-8"
                onClick={() => handleAction("arrival")}
                disabled={isPresent}
              >
                Příchod
              </Button>
              <Button size="lg" className="h-28 text-xl py-8" onClick={() => handleAction("departure")}>
                Odchod
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button variant="outline" className="py-3 text-base" onClick={() => showCustomForm("arrival")}>
                Jiný příchod
              </Button>
              <Button variant="outline" className="py-3 text-base" onClick={() => showCustomForm("departure")}>
                Jiný odchod
              </Button>
            </div>

            <Button variant="secondary" className="mt-4 py-3 text-base" onClick={() => handleAction("break")}>
              Pauza
            </Button>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="py-2 text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={() => showSpecialForm("vacation")}
              >
                <Umbrella className="h-4 w-4 mr-2" />
                Dovolená
              </Button>
              <Button
                variant="outline"
                className="py-2 text-sm bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                onClick={() => showSpecialForm("sick")}
              >
                <Thermometer className="h-4 w-4 mr-2" />
                Nemoc
              </Button>
            </div>
          </div>
        ) : showCustom ? (
          <div className="grid gap-4">
            <h3 className="text-center font-medium">
              {customType === "arrival" ? "Vlastní příchod" : "Vlastní odchod"}
            </h3>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP", { locale: cs }) : <span>Vyberte datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customDate} onSelect={setCustomDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                      <Clock3 className="mr-2 h-4 w-4" />
                      {customTime || <span>Vyberte čas</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Clock value={customTime} onChange={setCustomTime} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setShowCustom(false)}>
                Zpět
              </Button>
              <Button onClick={handleCustomAction}>Uložit</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <h3 className="text-center font-medium">{specialType === "vacation" ? "Dovolená" : "Nemoc"}</h3>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "d. MMMM", { locale: cs })} -{" "}
                            {format(dateRange.to, "d. MMMM yyyy", { locale: cs })}
                          </>
                        ) : (
                          format(dateRange.from, "d. MMMM yyyy", { locale: cs })
                        )
                      ) : (
                        <span>Vyberte období</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setShowSpecial(false)}>
                Zpět
              </Button>
              <Button onClick={handleSpecialAction}>Uložit</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
