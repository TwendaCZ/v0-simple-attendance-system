import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { format, parseISO, isWeekend, differenceInMinutes } from "date-fns"
import { cs } from "date-fns/locale"
import type { User, AttendanceRecord } from "./types"

// Add type definition for jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Funkce pro formátování času ve formátu "Xh Ym"
function formatTimeHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Funkce pro výpočet pracovní doby a pauzy pro jeden den
function calculateDayWorkAndBreakTime(records: AttendanceRecord[]): { workMinutes: number; breakMinutes: number } {
  if (!records || records.length === 0) return { workMinutes: 0, breakMinutes: 0 }

  // Seřazení záznamů podle času
  const sortedRecords = [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  let totalWorkMinutes = 0
  let totalBreakMinutes = 0
  let lastArrival: Date | null = null
  let lastBreakStart: Date | null = null
  let onBreak = false

  for (let i = 0; i < sortedRecords.length; i++) {
    const record = sortedRecords[i]
    const timestamp = parseISO(record.timestamp)

    if (record.type === "arrival") {
      lastArrival = timestamp
      onBreak = false
    } else if (record.type === "departure" && lastArrival) {
      if (!onBreak) {
        totalWorkMinutes += differenceInMinutes(timestamp, lastArrival)
      }
      lastArrival = null
    } else if (record.type === "break") {
      if (lastArrival && !onBreak) {
        // Konec pracovní doby, začátek pauzy
        totalWorkMinutes += differenceInMinutes(timestamp, lastArrival)
        lastBreakStart = timestamp
        onBreak = true
      } else if (onBreak && lastBreakStart) {
        // Konec pauzy, začátek pracovní doby
        totalBreakMinutes += differenceInMinutes(timestamp, lastBreakStart)
        lastArrival = timestamp
        onBreak = false
      }
    }
  }

  return { workMinutes: totalWorkMinutes, breakMinutes: totalBreakMinutes }
}

export function generatePDF(
  user: User,
  records: AttendanceRecord[],
  recordsByDay: Record<string, AttendanceRecord[]>,
  totalWorkHours: number,
  totalEarnings: number,
) {
  // Vytvoření nového PDF dokumentu
  const doc = new jsPDF({
    orientation: "landscape", // Změna na landscape pro více prostoru
    unit: "mm",
    format: "a4",
  })

  // Přidání fontu s podporou českých znaků
  // Poznámka: standardní fonty v jsPDF mají omezenou podporu pro české znaky
  // Pro plnou podporu by bylo potřeba přidat vlastní font

  // Nadpis dokumentu
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  const title = `Docházka - ${user.name}`
  doc.text(title, 14, 15)

  // Datum vygenerování
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const generatedDate = format(new Date(), "dd.MM.yyyy HH:mm", { locale: cs })
  doc.text(`Vygenerováno: ${generatedDate}`, 14, 22)

  // Příprava dat pro tabulku
  const tableData = []
  const sortedDays = Object.keys(recordsByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let totalWorkMinutes = 0
  let totalBreakMinutes = 0
  let totalMoney = 0

  for (const day of sortedDays) {
    const dayRecords = recordsByDay[day]
    const date = new Date(day)
    const formattedDate = format(date, "dd.MM.yyyy", { locale: cs })
    const isWeekendDay = isWeekend(date)

    // Nalezení záznamů příchodů, odchodů a pauz
    const arrivals = dayRecords
      .filter((r) => r.type === "arrival")
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((r) => format(parseISO(r.timestamp), "HH:mm", { locale: cs }))
      .join(", ")

    const departures = dayRecords
      .filter((r) => r.type === "departure")
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((r) => format(parseISO(r.timestamp), "HH:mm", { locale: cs }))
      .join(", ")

    const breaks = dayRecords
      .filter((r) => r.type === "break")
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((r) => format(parseISO(r.timestamp), "HH:mm", { locale: cs }))
      .join(", ")

    // Výpočet pracovní doby a pauzy pro tento den
    const { workMinutes, breakMinutes } = calculateDayWorkAndBreakTime(dayRecords)
    totalWorkMinutes += workMinutes
    totalBreakMinutes += breakMinutes

    // Výpočet výdělku pro tento den (použití hodin, ne minut)
    const workHours = workMinutes / 60
    const dayEarnings = workHours * (isWeekendDay ? 250 : 200) // Použití sazeb z kódu
    totalMoney += dayEarnings

    // Formátování času a peněz
    const formattedWorkTime = formatTimeHoursMinutes(workMinutes)
    const formattedBreakTime = formatTimeHoursMinutes(breakMinutes)
    const formattedEarnings = `${dayEarnings.toFixed(2).replace(".", ",")} Kč`

    tableData.push([
      formattedDate,
      arrivals,
      departures,
      breaks,
      formattedWorkTime,
      formattedBreakTime,
      isWeekendDay ? "Ano" : "Ne",
      formattedEarnings,
    ])
  }

  // Formátování celkových hodnot
  const totalWorkTimeFormatted = `${Math.floor(totalWorkMinutes / 60)} hodin a ${totalWorkMinutes % 60} minut`
  const totalMoneyFormatted = `${totalMoney.toFixed(2).replace(".", ",")} Kč`

  // Generování tabulky
  doc.autoTable({
    startY: 30,
    head: [["Datum", "Příchod", "Odchod", "Pauzy", "Celkem práce", "Celkem pauzy", "Víkend", "Výdělek"]],
    body: tableData,
    foot: [
      [
        "CELKEM",
        "",
        "",
        "",
        totalWorkTimeFormatted,
        formatTimeHoursMinutes(totalBreakMinutes),
        "",
        totalMoneyFormatted,
      ],
    ],
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    bodyStyles: {
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center" }, // Datum
      1: { halign: "center" }, // Příchod
      2: { halign: "center" }, // Odchod
      3: { halign: "center" }, // Pauzy
      4: { halign: "center" }, // Celkem práce
      5: { halign: "center" }, // Celkem pauzy
      6: { halign: "center" }, // Víkend
      7: { halign: "right" }, // Výdělek
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
    },
    margin: { top: 30, right: 14, bottom: 20, left: 14 },
    didDrawPage: (data) => {
      // Přidání zápatí na každou stránku
      const pageCount = doc.internal.getNumberOfPages()
      const currentPage = data.pageNumber

      // Zápatí
      doc.setFontSize(8)
      doc.text(
        `Strana ${currentPage} z ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" },
      )
    },
  })

  // Přidání souhrnných informací pod tabulku
  const finalY = (doc as any).lastAutoTable.finalY || 150
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(`Celkem odpracováno: ${totalWorkTimeFormatted}`, 14, finalY + 10)
  doc.text(`Celkový výdělek: ${totalMoneyFormatted}`, 14, finalY + 18)

  // Uložení PDF
  doc.save(`dochazka-${user.name.toLowerCase().replace(/\s+/g, "-")}.pdf`)
}
