"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { clearAllData, logAllData, migrateLocalStorageToRedis, forceRefreshData } from "@/lib/data"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

export function DebugPanel() {
  const [showDebug, setShowDebug] = useState(false)
  const [debugData, setDebugData] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [redisStatus, setRedisStatus] = useState<"checking" | "available" | "unavailable">("checking")

  // Check Redis status when debug panel is opened
  useEffect(() => {
    const checkRedisStatus = async () => {
      try {
        setRedisStatus("checking")
        const response = await fetch("/api/debug-data")
        const data = await response.json()
        setRedisStatus(data.redis.available ? "available" : "unavailable")
      } catch (error) {
        console.error("Error checking Redis status:", error)
        setRedisStatus("unavailable")
      }
    }

    if (showDebug) {
      checkRedisStatus()
    }
  }, [showDebug])

  const handleClearData = async () => {
    if (confirm("Opravdu chcete smazat všechna data? Tato akce je nevratná.")) {
      setLoading(true)
      setMessage("Mazání dat...")

      try {
        await clearAllData()
        setMessage("Data byla úspěšně smazána. Stránka se nyní obnoví.")
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        console.error("Error clearing data:", error)
        setMessage("Chyba při mazání dat: " + error)
        setLoading(false)
      }
    }
  }

  const handleLogData = async () => {
    setLoading(true)
    setMessage("Načítání dat...")

    try {
      await logAllData()

      // Get data for display from Redis
      const response = await fetch("/api/debug-data")
      if (response.ok) {
        const data = await response.json()
        setDebugData(JSON.stringify(data, null, 2))
        setMessage("Data byla načtena")
        setRedisStatus(data.redis.available ? "available" : "unavailable")
      } else {
        const errorData = await response.json()
        throw new Error(`Nepodařilo se načíst data: ${errorData.message || "Neznámá chyba"}`)
      }
    } catch (error) {
      console.error("Error getting data:", error)
      setMessage("Chyba při načítání dat: " + error)
      setDebugData(`Error getting data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMigrateData = async () => {
    if (confirm("Opravdu chcete migrovat data z localStorage do Redis? Existující data v Redis budou přepsána.")) {
      setLoading(true)
      setMessage("Migrace dat...")

      try {
        const success = await migrateLocalStorageToRedis()
        if (success) {
          setMessage("Data byla úspěšně migrována")
          // Refresh data after migration
          await forceRefreshData()
        } else {
          setMessage("Migrace dat selhala")
        }
      } catch (error) {
        console.error("Error migrating data:", error)
        setMessage("Chyba při migraci dat: " + error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleForceRefresh = async () => {
    setLoading(true)
    setMessage("Obnovování dat...")

    try {
      await forceRefreshData()
      setMessage("Data byla úspěšně obnovena. Stránka se nyní obnoví.")
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setMessage("Chyba při obnovování dat: " + error)
    } finally {
      setLoading(false)
    }
  }

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-[80vh] overflow-auto">
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex justify-between items-center">
            <span>Debug Panel</span>
            {redisStatus !== "checking" && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  redisStatus === "available" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                Redis: {redisStatus === "available" ? "Dostupný" : "Nedostupný"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {message && <div className="text-sm mb-2 p-2 bg-blue-50 border border-blue-200 rounded">{message}</div>}

          {redisStatus === "unavailable" && (
            <Alert className="mb-2 bg-red-50 border-red-200">
              <AlertDescription>
                Redis není dostupný. Aplikace nebude fungovat správně, dokud nebude Redis připojen.
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleForceRefresh}
            disabled={loading || redisStatus !== "available"}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Vynutit obnovení dat
          </Button>

          <Button variant="destructive" size="sm" className="w-full" onClick={handleClearData} disabled={loading}>
            Smazat všechna data
          </Button>

          <Button variant="outline" size="sm" className="w-full" onClick={handleLogData} disabled={loading}>
            Vypsat data
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleMigrateData}
            disabled={loading || redisStatus !== "available"}
          >
            Migrovat data z localStorage
          </Button>

          {debugData && (
            <Textarea
              value={debugData}
              readOnly
              className="mt-2 h-40 text-xs font-mono"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          )}

          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDebug(false)}>
            Zavřít
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
