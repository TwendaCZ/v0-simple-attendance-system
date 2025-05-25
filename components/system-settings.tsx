"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAutoRefreshSetting, saveAutoRefreshSetting, triggerManualRefresh } from "@/lib/settings"
import { forceRefreshData } from "@/lib/data"
import { RefreshCw } from "lucide-react"

export function SystemSettings() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const setting = await getAutoRefreshSetting()
        setAutoRefresh(setting)
      } catch (error) {
        console.error("Error loading auto refresh setting:", error)
        setMessage({ text: "Chyba při načítání nastavení", type: "error" })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleAutoRefreshChange = async (enabled: boolean) => {
    try {
      setLoading(true)
      await saveAutoRefreshSetting(enabled)
      setAutoRefresh(enabled)
      setMessage({
        text: enabled ? "Automatické obnovování dat bylo zapnuto" : "Automatické obnovování dat bylo vypnuto",
        type: "success",
      })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error saving auto refresh setting:", error)
      setMessage({ text: "Chyba při ukládání nastavení", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true)
      setMessage({ text: "Probíhá obnovování dat...", type: "success" })

      // Trigger manual refresh
      await triggerManualRefresh()

      // Force refresh data
      await forceRefreshData()

      setMessage({ text: "Data byla úspěšně obnovena", type: "success" })

      // Reload page after 1 second to show refreshed data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error triggering manual refresh:", error)
      setMessage({ text: "Chyba při obnovování dat", type: "error" })
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Načítání nastavení systému...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nastavení systému</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert
            className={message.type === "error" ? "bg-red-50 border-red-200 mb-4" : "bg-green-50 border-green-200 mb-4"}
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-refresh" className="text-base">
                Automatické obnovování dat
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Když je zapnuto, data se automaticky obnovují každých 5 minut na všech zařízeních
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={handleAutoRefreshChange}
              disabled={loading}
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleManualRefresh} disabled={refreshing} className="w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Obnovování dat..." : "Ručně obnovit data"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Tato akce obnoví data na všech připojených zařízeních
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
