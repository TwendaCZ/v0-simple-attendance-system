"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { cs } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Clock } from "@/components/ui/clock"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateAttendanceRecord, deleteAttendanceRecord } from "@/lib/data"
import { CalendarIcon, Clock3, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EditReportModalProps {
  record: any
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function EditReportModal({ record, isOpen, onClose, userId }: EditReportModalProps) {
  const timestamp = parseISO(record.timestamp)

  const [date, setDate] = useState<Date | undefined>(timestamp)
  const [time, setTime] = useState(format(timestamp, "HH:mm"))
  const [type, setType] = useState(record.type)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    if (!date) return
    setLoading(true)
    setMessage(null)

    try {
      const [hours, minutes] = time.split(":").map(Number)
      const newTimestamp = new Date(date)
      newTimestamp.setHours(hours, minutes, 0, 0)

      // Vytvoření záznamu o změnách
      const changes = []

      if (type !== record.type) {
        changes.push(`Typ změněn z "${getTypeLabel(record.type)}" na "${getTypeLabel(type)}"`)
      }

      if (format(timestamp, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")) {
        changes.push(`Datum změněno z "${format(timestamp, "d.M.yyyy")}" na "${format(date, "d.M.yyyy")}"`)
      }

      if (format(timestamp, "HH:mm") !== time) {
        changes.push(`Čas změněn z "${format(timestamp, "HH:mm")}" na "${time}"`)
      }

      const changeLog = changes.length > 0 ? changes.join(", ") : "Upraveno ručně"

      const success = await updateAttendanceRecord(userId, record, {
        ...record,
        type,
        timestamp: newTimestamp.toISOString(),
        isCustom: true,
        changeLog: changeLog,
      })

      if (success) {
        setMessage("Záznam byl úspěšně aktualizován")
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage("Chyba: Záznam se nepodařilo aktualizovat")
      }
    } catch (error) {
      console.error("Error updating record:", error)
      setMessage("Došlo k chybě při aktualizaci záznamu")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const success = await deleteAttendanceRecord(userId, record)

      if (success) {
        setMessage("Záznam byl úspěšně smazán")
        setTimeout(() => {
          setShowDeleteConfirm(false)
          onClose()
        }, 1500)
      } else {
        setMessage("Chyba: Záznam se nepodařilo smazat")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
      setMessage("Došlo k chybě při mazání záznamu")
    } finally {
      setLoading(false)
    }
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

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Potvrdit smazání</DialogTitle>
            <DialogDescription>Tato akce je nevratná. Opravdu chcete smazat tento záznam?</DialogDescription>
          </DialogHeader>

          {message && (
            <Alert className={message.includes("Chyba") ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Mazání...</span>
            </div>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Upozornění</AlertTitle>
                <AlertDescription>
                  Smazáním záznamu dojde k trvalému odstranění této položky z docházky.
                </AlertDescription>
              </Alert>

              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Zrušit
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Ano, smazat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upravit záznam</DialogTitle>
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
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Typ záznamu</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Vyberte typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arrival">Příchod</SelectItem>
                    <SelectItem value="departure">Odchod</SelectItem>
                    <SelectItem value="break">Pauza</SelectItem>
                    <SelectItem value="vacation">Dovolená</SelectItem>
                    <SelectItem value="sick">Nemoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: cs }) : <span>Vyberte datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Čas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                      <Clock3 className="mr-2 h-4 w-4" />
                      {time || <span>Vyberte čas</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Clock value={time} onChange={setTime} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="destructive" onClick={handleDelete}>
                Smazat
              </Button>
              <Button onClick={handleSave}>Uložit změny</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
