import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportEvolutionPdf(elementId: string, filename: string): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);

  // Temporarily make visible for capture
  const prevStyle = el.getAttribute("style") ?? "";
  el.setAttribute("style", "width:794px;background:white;position:fixed;left:0;top:0;z-index:99999;");

  try {
    // Wait for any pending renders
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(el, {
      scale: 1.5,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: 794,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 28;
    const contentW = pageW - margin * 2;
    const scale  = contentW / canvas.width;
    const contentH = canvas.height * scale;

    let yOffset = 0;
    const usableH = pageH - margin * 2;

    while (yOffset < contentH) {
      if (yOffset > 0) pdf.addPage();

      // Source rect on canvas
      const srcY  = yOffset / scale;
      const srcH  = Math.min(usableH / scale, canvas.height - srcY);

      // Crop canvas slice
      const slice = document.createElement("canvas");
      slice.width  = canvas.width;
      slice.height = Math.round(srcH);
      const ctx = slice.getContext("2d")!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, Math.round(srcH));

      const sliceData = slice.toDataURL("image/jpeg", 0.92);
      const sliceH = Math.round(srcH) * scale;

      pdf.addImage(sliceData, "JPEG", margin, margin, contentW, sliceH, undefined, "FAST");
      yOffset += usableH;
    }

    pdf.save(filename);
  } finally {
    el.setAttribute("style", prevStyle);
  }
}
