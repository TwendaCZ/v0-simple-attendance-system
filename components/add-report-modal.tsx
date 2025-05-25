"use client"

import { useState } from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Clock } from "@/components/ui/clock"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { addAttendanceRecord } from "@/lib/data"
import { CalendarIcon, Clock3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddReportModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function AddReportModal({ isOpen, onClose, userId }: AddReportModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState(format(new Date(), "HH:mm"))
  const [type, setType] = useState<string>("arrival")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    if (!date) return
    setLoading(true)
    setMessage(null)

    try {
      const [hours, minutes] = time.split(":").map(Number)
      const timestamp = new Date(date)
      timestamp.setHours(hours, minutes, 0, 0)

      const success = await addAttendanceRecord(userId, {
        type,
        timestamp: timestamp.toISOString(),
        isCustom: true,
        changeLog: `Ručně přidaný záznam typu "${getTypeLabel(type)}" (${format(timestamp, "d.M.yyyy HH:mm")})`,
      })

      if (success) {
        setMessage("Záznam byl úspěšně přidán")
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage("Chyba: Záznam se nepodařilo přidat")
      }
    } catch (error) {
      console.error("Error adding record:", error)
      setMessage("Došlo k chybě při přidávání záznamu")
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat nový záznam</DialogTitle>
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

            <DialogFooter>
              <Button onClick={handleSave}>Přidat záznam</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
