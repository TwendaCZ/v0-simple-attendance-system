"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSettings } from "@/components/user-settings"
import { RateSettings } from "@/components/rate-settings"
import { SystemSettings } from "@/components/system-settings"
import { AdminSettingsModal } from "@/components/admin-settings-modal"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Načtení stavu admin z localStorage při načtení komponenty
  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminState = localStorage.getItem("attendance-admin")
      setIsAdmin(adminState === "true")
      setLoading(false)
    }
  }, [])

  // Přesměrování na dashboard, pokud uživatel není admin
  useEffect(() => {
    if (!loading && !isAdmin && typeof window !== "undefined") {
      router.push("/dashboard")
    }
  }, [isAdmin, router, loading])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Stránka se nezobrazí, pokud uživatel není admin
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Nastavení</h1>
            <p className="text-muted-foreground">Správa uživatelů, sazeb a systémových nastavení</p>
          </div>
          <Button variant="outline" onClick={() => setShowAdminSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Nastavení administrace
          </Button>
        </div>

        <Tabs defaultValue="users" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users">Uživatelé</TabsTrigger>
            <TabsTrigger value="rates">Hodinové sazby</TabsTrigger>
            <TabsTrigger value="system">Systém</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserSettings />
          </TabsContent>

          <TabsContent value="rates">
            <RateSettings />
          </TabsContent>

          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>

      <AdminSettingsModal isOpen={showAdminSettings} onClose={() => setShowAdminSettings(false)} />
    </div>
  )
}
