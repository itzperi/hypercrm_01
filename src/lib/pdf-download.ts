"use client";

export async function downloadDocumentPdf(element: HTMLElement, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save();
}
