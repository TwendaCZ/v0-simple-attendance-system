import redis from "./redis-client"

// Klíč pro admin nastavení v Redis
const ADMIN_SETTINGS_KEY = "attendance-admin-settings"

// Výchozí admin heslo
const DEFAULT_ADMIN_PASSWORD = "1616"

// Získání admin nastavení
export async function getAdminSettings(): Promise<{ password: string }> {
  try {
    const settings = await redis.get<{ password: string }>(ADMIN_SETTINGS_KEY)
    return settings || { password: DEFAULT_ADMIN_PASSWORD }
  } catch (error) {
    console.error("Error getting admin settings:", error)
    return { password: DEFAULT_ADMIN_PASSWORD }
  }
}

// Uložení admin nastavení
export async function saveAdminSettings(settings: { password: string }): Promise<void> {
  try {
    await redis.set(ADMIN_SETTINGS_KEY, settings)
  } catch (error) {
    console.error("Error saving admin settings:", error)
    throw new Error("Nepodařilo se uložit admin nastavení")
  }
}

// Ověření admin hesla
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const settings = await getAdminSettings()
    return password === settings.password
  } catch (error) {
    console.error("Error verifying admin password:", error)
    return false
  }
}
