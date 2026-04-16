"use client";

import { useState } from "react";

export function ReportButton() {
  const [loading, setLoading] = useState(false);

  async function generatePDF() {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(document.body, {
        scale: 1.5,
        useCORS: true,
        logging: false,
      });
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: "a4",
      });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
      pdf.save(`seo-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void generatePDF()}
      disabled={loading}
      className="text-sm px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 dark:bg-green-950 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900"
    >
      {loading ? "Генерация…" : "↓ PDF отчёт"}
    </button>
  );
}
