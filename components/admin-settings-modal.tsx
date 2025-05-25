"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAdminSettings, saveAdminSettings } from "@/lib/admin"

interface AdminSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAdminSettings()
        setPassword(settings.password)
        setConfirmPassword(settings.password)
      } catch (error) {
        console.error("Error loading admin settings:", error)
        setMessage({ text: "Chyba při načítání nastavení", type: "error" })
      }
    }

    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!password.trim()) {
      setMessage({ text: "Heslo nemůže být prázdné", type: "error" })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Hesla se neshodují", type: "error" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await saveAdminSettings({ password })
      setMessage({ text: "Nastavení bylo úspěšně uloženo", type: "success" })

      // Zavřít modal po úspěšném uložení
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error saving admin settings:", error)
      setMessage({ text: "Chyba při ukládání nastavení", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nastavení administrace</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {message && (
            <Alert
              className={
                message.type === "error" ? "mb-4 bg-red-50 border-red-200" : "mb-4 bg-green-50 border-green-200"
              }
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nové heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadejte nové heslo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrzení hesla</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zadejte heslo znovu"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Ukládání..." : "Uložit nastavení"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
