export interface User {
  id: string
  name: string
}

export interface AttendanceRecord {
  type: "arrival" | "departure" | "break" | "vacation" | "sick"
  timestamp: string
  isCustom?: boolean
  isSpecial?: boolean
  allDay?: boolean
  changeLog?: string
}

export interface Rates {
  weekday: number
  weekend: number
}

export interface AdminSettings {
  password: string
}
