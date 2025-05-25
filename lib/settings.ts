import redis from "./redis-client"

// Klíč pro nastavení v Redis
const AUTO_REFRESH_SETTING_KEY = "attendance-auto-refresh"

// Výchozí hodnota pro automatické obnovování
const DEFAULT_AUTO_REFRESH = true

// Získání nastavení automatického obnovování
export async function getAutoRefreshSetting(): Promise<boolean> {
  try {
    const setting = await redis.get<boolean>(AUTO_REFRESH_SETTING_KEY)
    return setting !== null ? setting : DEFAULT_AUTO_REFRESH
  } catch (error) {
    console.error("Error getting auto refresh setting:", error)
    return DEFAULT_AUTO_REFRESH
  }
}

// Uložení nastavení automatického obnovování
export async function saveAutoRefreshSetting(enabled: boolean): Promise<void> {
  try {
    await redis.set(AUTO_REFRESH_SETTING_KEY, enabled)
  } catch (error) {
    console.error("Error saving auto refresh setting:", error)
    throw new Error("Nepodařilo se uložit nastavení automatického obnovování")
  }
}

// Ruční obnovení dat
export async function triggerManualRefresh(): Promise<void> {
  try {
    // Nastavíme časové razítko posledního ručního obnovení
    await redis.set("attendance-last-manual-refresh", new Date().toISOString())
  } catch (error) {
    console.error("Error triggering manual refresh:", error)
    throw new Error("Nepodařilo se spustit ruční obnovení dat")
  }
}
