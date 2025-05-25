"use client"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ClockProps {
  value: string
  onChange: (value: string) => void
}

export function Clock({ value, onChange }: ClockProps) {
  const [hours, minutes] = value.split(":").map(Number)

  const incrementHours = () => {
    const newHours = (hours + 1) % 24
    onChange(`${newHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
  }

  const decrementHours = () => {
    const newHours = (hours - 1 + 24) % 24
    onChange(`${newHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
  }

  const incrementMinutes = () => {
    const newMinutes = (minutes + 5) % 60
    onChange(`${hours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`)
  }

  const decrementMinutes = () => {
    const newMinutes = (minutes - 5 + 60) % 60
    onChange(`${hours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`)
  }

  return (
    <div className="p-4 w-full max-w-[280px]">
      <div className="flex justify-center items-center gap-6">
        <div className="flex flex-col items-center">
          <Button variant="ghost" size="icon" className="h-12 w-12" onClick={incrementHours}>
            <ChevronUp className="h-6 w-6" />
          </Button>
          <div className="text-3xl font-semibold w-14 text-center">{hours.toString().padStart(2, "0")}</div>
          <Button variant="ghost" size="icon" className="h-12 w-12" onClick={decrementHours}>
            <ChevronDown className="h-6 w-6" />
          </Button>
        </div>

        <div className="text-3xl font-semibold">:</div>

        <div className="flex flex-col items-center">
          <Button variant="ghost" size="icon" className="h-12 w-12" onClick={incrementMinutes}>
            <ChevronUp className="h-6 w-6" />
          </Button>
          <div className="text-3xl font-semibold w-14 text-center">{minutes.toString().padStart(2, "0")}</div>
          <Button variant="ghost" size="icon" className="h-12 w-12" onClick={decrementMinutes}>
            <ChevronDown className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-6">
        {[0, 6, 12, 18].map((h) => (
          <Button
            key={h}
            variant="outline"
            className="py-2"
            onClick={() => onChange(`${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)}
          >
            {h.toString().padStart(2, "0")}:00
          </Button>
        ))}
      </div>
    </div>
  )
}
