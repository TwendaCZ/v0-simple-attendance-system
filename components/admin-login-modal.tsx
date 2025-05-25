"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verifyAdminPassword } from "@/lib/admin"

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: () => void
}

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("Zadejte heslo")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const isValid = await verifyAdminPassword(password)

      if (isValid) {
        onLoginSuccess()
      } else {
        setError("Nesprávné heslo")
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      setError("Došlo k chybě při ověřování hesla")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přihlášení administrátora</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Zadejte heslo"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Zrušit
          </Button>
          <Button onClick={handleLogin} disabled={loading}>
            {loading ? "Ověřování..." : "Přihlásit se"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
