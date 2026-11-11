// Bodhi Sanctuary — Habit Trend Export Utility
// Generates high-resolution contemplative PNG and pure client-side PDF documents

export interface HabitTrendExportData {
  weeklyRate: number;
  totalCompletionsInWeek: number;
  days: {
    dateStr: string;
    label: string;
    fullDate: string;
    count: number;
    total: number;
    pct: number;
  }[];
  habits: {
    title: string;
    targetMinutes: number;
    streak: number;
    completedToday: boolean;
  }[];
}

/**
 * Draws a high-DPI 1200x740 contemplative card onto an HTML Canvas.
 */
export function renderTrendToCanvas(data: HabitTrendExportData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 740;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background Parchment Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#faf6ee");
  bgGrad.addColorStop(0.5, "#f6efe3");
  bgGrad.addColorStop(1, "#eee4d2");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Border
  ctx.strokeStyle = "rgba(180, 83, 9, 0.25)";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Inner Thin Border
  ctx.strokeStyle = "rgba(180, 83, 9, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // Corner Embellishments
  const drawCorner = (x: number, y: number) => {
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCorner(32, 32);
  drawCorner(width - 32, 32);
  drawCorner(32, height - 32);
  drawCorner(width - 32, height - 32);

  // Brand Header Pill
  ctx.fillStyle = "rgba(180, 83, 9, 0.1)";
  roundRect(ctx, 50, 48, 300, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#92400e";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("☸ BODHI SANCTUARY · DAILY RHYTHM", 66, 69);

  // Main Card Title
  ctx.fillStyle = "#1c1917";
  ctx.font = "bold 32px 'Georgia', serif";
  ctx.fillText("7-Day Practice Consistency Trend", 50, 120);

  // Subtitle / Date Range
  const firstDay = data.days[0]?.fullDate || "";
  const lastDay = data.days[data.days.length - 1]?.fullDate || "";
  ctx.fillStyle = "#78716c";
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.fillText(`Practice thread from ${firstDay} to ${lastDay} · 7-Day snapshot`, 50, 146);

  // Stat Badges (Top Right)
  // Consistency Badge
  ctx.fillStyle = "rgba(5, 150, 105, 0.12)";
  roundRect(ctx, width - 360, 52, 140, 42, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(5, 150, 105, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#065f46";
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${data.weeklyRate}% Rate`, width - 345, 78);

  // Total Sittings Badge
  ctx.fillStyle = "rgba(180, 83, 9, 0.12)";
  roundRect(ctx, width - 205, 52, 155, 42, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 83, 9, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#92400e";
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(`🔥 ${data.totalCompletionsInWeek} sittings`, width - 190, 78);

  // ==================== BAR CHART ====================
  const chartX = 60;
  const chartY = 180;
  const chartW = width - 120;
  const chartH = 240;

  // Chart Container Box
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  roundRect(ctx, chartX, chartY, chartW, chartH, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 83, 9, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Grid Guideline Lines (100%, 50%, 0%)
  const yLines = [
    { pct: 100, label: "100%" },
    { pct: 50, label: "50%" },
    { pct: 0, label: "0%" },
  ];
  yLines.forEach((line) => {
    const yPos = chartY + 25 + (1 - line.pct / 100) * 140;
    ctx.strokeStyle = "rgba(214, 211, 209, 0.6)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartX + 60, yPos);
    ctx.lineTo(chartX + chartW - 30, yPos);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#a8a29e";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText(line.label, chartX + 22, yPos + 4);
  });

  // Render 7 Day Bars
  const numDays = data.days.length;
  const usableW = chartW - 120;
  const colW = usableW / numDays;
  const barMaxH = 140;

  data.days.forEach((day, idx) => {
    const cx = chartX + 80 + idx * colW + colW / 2;
    const barW = 54;
    const barH = Math.max(10, (day.pct / 100) * barMaxH);
    const barTop = chartY + 25 + (barMaxH - barH);
    const barLeft = cx - barW / 2;

    // Bar Pillar Background Track
    ctx.fillStyle = "rgba(245, 245, 244, 0.9)";
    roundRect(ctx, barLeft, chartY + 25, barW, barMaxH, 10);
    ctx.fill();

    // Actual Bar Fill with Gradient
    if (day.count > 0) {
      const barGrad = ctx.createLinearGradient(0, barTop + barH, 0, barTop);
      if (day.pct >= 100) {
        barGrad.addColorStop(0, "#059669");
        barGrad.addColorStop(1, "#34d399");
      } else {
        barGrad.addColorStop(0, "#d97706");
        barGrad.addColorStop(1, "#fbbf24");
      }
      ctx.fillStyle = barGrad;
      roundRect(ctx, barLeft, barTop, barW, barH, 10);
      ctx.fill();
    }

    // Top Count / Percentage Pill
    ctx.fillStyle = day.count > 0 ? "#1c1917" : "#a8a29e";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${day.count}/${day.total}`, cx, chartY + 18);

    // Day Label (e.g. Mon, Today)
    const isToday = idx === numDays - 1;
    ctx.fillStyle = isToday ? "#92400e" : "#44403c";
    ctx.font = isToday
      ? "bold 13px system-ui, -apple-system, sans-serif"
      : "600 13px system-ui, -apple-system, sans-serif";
    ctx.fillText(day.label, cx, chartY + 190);

    // Date Label (e.g. Oct 27)
    ctx.fillStyle = "#78716c";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText(day.fullDate, cx, chartY + 208);
  });
  ctx.textAlign = "left";

  // ==================== HABIT BREAKDOWN SUMMARY ====================
  const habitsY = 440;
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  roundRect(ctx, chartX, habitsY, chartW, 175, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 83, 9, 0.12)";
  ctx.stroke();

  ctx.fillStyle = "#78716c";
  ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("ACTIVE DAILY COMMITMENTS", chartX + 24, habitsY + 28);

  const displayHabits = data.habits.slice(0, 3);
  displayHabits.forEach((h, i) => {
    const hy = habitsY + 58 + i * 36;
    ctx.fillStyle = h.completedToday ? "#059669" : "#a8a29e";
    ctx.beginPath();
    ctx.arc(chartX + 32, hy - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1c1917";
    ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
    ctx.fillText(h.title, chartX + 48, hy);

    ctx.fillStyle = "#78716c";
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillText(`⏱ ${h.targetMinutes} min`, chartX + 420, hy);

    if (h.streak > 0) {
      ctx.fillStyle = "#92400e";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText(`🔥 ${h.streak}-day streak`, chartX + 540, hy);
    }

    if (h.completedToday) {
      ctx.fillStyle = "#047857";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText("✓ Done today", chartX + 700, hy);
    }
  });

  // Footer Dharma Quote
  ctx.fillStyle = "#57534e";
  ctx.font = "italic 13px 'Georgia', serif";
  const quote =
    "“Drop by drop is the water pot filled. Likewise, the wise one, gathering it little by little, fills oneself with good.” — Dhammapada 122";
  ctx.fillText(quote, chartX + 24, habitsY + 154);

  // Bottom Watermark
  ctx.fillStyle = "#a8a29e";
  ctx.font = "11px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `Exported from Bodhi Sanctuary · ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}`,
    chartX,
    height - 38
  );

  return canvas;
}

/**
 * Helper to draw rounded rectangle on Canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Downloads the trend card as high-resolution PNG image.
 */
export function exportAsPng(data: HabitTrendExportData, filename = "bodhi-habit-trend.png") {
  const canvas = renderTrendToCanvas(data);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

/**
 * Converts JPEG data to pure standard PDF 1.4 document and downloads it.
 */
export function exportAsPdf(data: HabitTrendExportData, filename = "bodhi-habit-trend.pdf") {
  const canvas = renderTrendToCanvas(data);
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const base64Data = jpegDataUrl.split(",")[1];
  const binaryString = atob(base64Data);
  const imgLength = binaryString.length;

  const imgBytes = new Uint8Array(imgLength);
  for (let i = 0; i < imgLength; i++) {
    imgBytes[i] = binaryString.charCodeAt(i);
  }

  // A4 Landscape dimensions: 841.89 x 595.28 points
  const pdfW = 841.89;
  const pdfH = 595.28;

  // Fit image with 30pt padding
  const margin = 30;
  const fitW = pdfW - margin * 2;
  const fitH = (canvas.height / canvas.width) * fitW;
  const posX = margin;
  const posY = (pdfH - fitH) / 2;

  // Construct PDF structure
  const header = "%PDF-1.4\n";

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW.toFixed(2)} ${pdfH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`;

  const streamContent = `q\n${fitW.toFixed(2)} 0 0 ${fitH.toFixed(2)} ${posX.toFixed(2)} ${posY.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  const obj5Prefix = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLength} >>\nstream\n`;
  const obj5Suffix = "\nendstream\nendobj\n";

  // Build full buffer
  const enc = new TextEncoder();
  const partHeader = enc.encode(header);
  const partObj1 = enc.encode(obj1);
  const partObj2 = enc.encode(obj2);
  const partObj3 = enc.encode(obj3);
  const partObj4 = enc.encode(obj4);
  const partObj5Pre = enc.encode(obj5Prefix);
  const partObj5Suf = enc.encode(obj5Suffix);

  // Compute xref offsets
  let offset = partHeader.length;
  const offset1 = offset;
  offset += partObj1.length;
  const offset2 = offset;
  offset += partObj2.length;
  const offset3 = offset;
  offset += partObj3.length;
  const offset4 = offset;
  offset += partObj4.length;
  const offset5 = offset;
  offset += partObj5Pre.length + imgBytes.length + partObj5Suf.length;

  const xref = `xref\n0 6\n0000000000 65535 f \n${String(offset1).padStart(10, "0")} 00000 n \n${String(offset2).padStart(10, "0")} 00000 n \n${String(offset3).padStart(10, "0")} 00000 n \n${String(offset4).padStart(10, "0")} 00000 n \n${String(offset5).padStart(10, "0")} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

  const partXref = enc.encode(xref);
  const partTrailer = enc.encode(trailer);

  const totalLength =
    offset +
    partXref.length +
    partTrailer.length;

  const finalPdf = new Uint8Array(totalLength);
  let pos = 0;

  const append = (arr: Uint8Array) => {
    finalPdf.set(arr, pos);
    pos += arr.length;
  };

  append(partHeader);
  append(partObj1);
  append(partObj2);
  append(partObj3);
  append(partObj4);
  append(partObj5Pre);
  append(imgBytes);
  append(partObj5Suf);
  append(partXref);
  append(partTrailer);

  const pdfBlob = new Blob([finalPdf], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
