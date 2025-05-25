"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRates, saveRates } from "@/lib/data"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function RateSettings() {
  const [weekdayRate, setWeekdayRate] = useState("200")
  const [weekendRate, setWeekendRate] = useState("250")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await getRates()
        setWeekdayRate(rates.weekday.toString())
        setWeekendRate(rates.weekend.toString())
      } catch (error) {
        console.error("Error loading rates:", error)
        setMessage({ text: "Chyba při načítání sazeb", type: "error" })
      } finally {
        setLoading(false)
      }
    }

    loadRates()
  }, [])

  const handleSave = async () => {
    try {
      await saveRates({
        weekday: Number.parseFloat(weekdayRate) || 200,
        weekend: Number.parseFloat(weekendRate) || 250,
      })
      setMessage({ text: "Sazby byly úspěšně uloženy", type: "success" })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error saving rates:", error)
      setMessage({ text: "Chyba při ukládání sazeb", type: "error" })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Načítání sazeb...</CardTitle>
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
        <CardTitle>Hodinové sazby</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert
            className={message.type === "error" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}
            className="mb-4"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="weekday-rate">Sazba pro pracovní dny (Po-Pá)</Label>
            <div className="flex items-center">
              <Input
                id="weekday-rate"
                type="number"
                value={weekdayRate}
                onChange={(e) => setWeekdayRate(e.target.value)}
              />
              <span className="ml-2">Kč/h</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="weekend-rate">Sazba pro víkendy (So-Ne)</Label>
            <div className="flex items-center">
              <Input
                id="weekend-rate"
                type="number"
                value={weekendRate}
                onChange={(e) => setWeekendRate(e.target.value)}
              />
              <span className="ml-2">Kč/h</span>
            </div>
          </div>

          <Button onClick={handleSave} className="mt-4">
            Uložit sazby
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
