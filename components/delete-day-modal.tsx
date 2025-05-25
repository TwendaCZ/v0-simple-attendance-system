"use client"

import { useState } from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { deleteDayRecords } from "@/lib/data"

interface DeleteDayModalProps {
  day: string
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function DeleteDayModal({ day, isOpen, onClose, userId }: DeleteDayModalProps) {
  const formattedDate = format(new Date(day), "EEEE d. MMMM yyyy", { locale: cs })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const success = await deleteDayRecords(userId, day)

      if (success) {
        setMessage("Záznamy byly úspěšně smazány")
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage("Chyba: Záznamy se nepodařilo smazat")
      }
    } catch (error) {
      console.error("Error deleting day records:", error)
      setMessage("Došlo k chybě při mazání záznamů")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Smazat celý den</DialogTitle>
          <DialogDescription>
            Chystáte se smazat všechny záznamy pro den <strong>{formattedDate}</strong>. Tato akce je nevratná.
          </DialogDescription>
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
                Smazáním dne dojde k trvalému odstranění všech záznamů docházky pro tento den.
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={onClose}>
                Zrušit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Ano, smazat celý den
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
