"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/types"
import { getUsers, saveUsers } from "@/lib/data"
import { X, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function UserSettings() {
  const [users, setUsers] = useState<User[]>([])
  const [newUserName, setNewUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const loadedUsers = await getUsers()
        setUsers(loadedUsers)
      } catch (error) {
        console.error("Error loading users:", error)
        setMessage({ text: "Chyba při načítání uživatelů", type: "error" })
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newUserName.trim()) return

    try {
      const newUser: User = {
        id: Date.now().toString(),
        name: newUserName.trim(),
      }

      const updatedUsers = [...users, newUser]
      setUsers(updatedUsers)
      await saveUsers(updatedUsers)
      setNewUserName("")
      setMessage({ text: "Uživatel byl úspěšně přidán", type: "success" })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error adding user:", error)
      setMessage({ text: "Chyba při přidávání uživatele", type: "error" })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const updatedUsers = users.filter((user) => user.id !== userId)
      setUsers(updatedUsers)
      await saveUsers(updatedUsers)
      setMessage({ text: "Uživatel byl úspěšně smazán", type: "success" })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error deleting user:", error)
      setMessage({ text: "Chyba při mazání uživatele", type: "error" })
    }
  }

  const handleUpdateUser = async (userId: string, name: string) => {
    try {
      const updatedUsers = users.map((user) => (user.id === userId ? { ...user, name } : user))
      setUsers(updatedUsers)
      await saveUsers(updatedUsers)
    } catch (error) {
      console.error("Error updating user:", error)
      setMessage({ text: "Chyba při aktualizaci uživatele", type: "error" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Načítání uživatelů...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === "error" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Přidat nového uživatele</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="new-user" className="mb-2 block">
                Jméno uživatele
              </Label>
              <Input
                id="new-user"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Zadejte jméno"
              />
            </div>
            <Button onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              Přidat
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seznam uživatelů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground">Zatím nejsou přidáni žádní uživatelé</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center gap-4">
                  <Input value={user.name} onChange={(e) => handleUpdateUser(user.id, e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
