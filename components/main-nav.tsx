"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AdminLoginModal } from "@/components/admin-login-modal"
import { Settings, LogOut } from "lucide-react"

// Definice položek navigace
const publicNavItems = [
  { href: "/dashboard", label: "Docházka" },
  { href: "/reports", label: "Reporty" },
]

const adminNavItems = [{ href: "/settings", label: "Nastavení" }]

export function MainNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Načtení stavu admin z localStorage při načtení komponenty
  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminState = localStorage.getItem("attendance-admin")
      setIsAdmin(adminState === "true")
    }
  }, [])

  // Funkce pro přihlášení admina
  const handleLoginSuccess = () => {
    setIsAdmin(true)
    localStorage.setItem("attendance-admin", "true")
    setShowLoginModal(false)
  }

  // Funkce pro odhlášení admina
  const handleLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem("attendance-admin")
  }

  return (
    <>
      <header className="border-b bg-white shadow-sm">
        <div className="container flex flex-col sm:flex-row h-auto sm:h-16 py-2 sm:py-0 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto mb-2 sm:mb-0">
            <div className="mr-0 sm:mr-8 font-bold text-xl mb-2 sm:mb-0">Docházkový systém</div>
            <nav className="flex items-center space-x-2 sm:space-x-6 text-sm font-medium">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-primary px-3 py-2 rounded-md",
                    pathname === item.href
                      ? "text-primary font-bold bg-primary/10"
                      : "text-foreground/60 hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin &&
                adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors hover:text-primary px-3 py-2 rounded-md",
                      pathname === item.href
                        ? "text-primary font-bold bg-primary/10"
                        : "text-foreground/60 hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            {isAdmin ? (
              <Button variant="outline" size="sm" className="py-2 px-4" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Odhlásit administrátora
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="py-2 px-4" onClick={() => setShowLoginModal(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Administrace
              </Button>
            )}
          </div>
        </div>
      </header>

      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}
