// GCash receipt scanning (client-side OCR with Tesseract.js). The scan only suggests values for
// the payment form; nothing here touches Firestore or a payment's status.

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH_PATTERN = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";

const pad = (value) => String(value).padStart(2, "0");

// Returns "YYYY-MM-DD" (the format of <input type="date">) or "" when the date isn't a real one.
function toIsoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 2000 || m < 1 || m > 12 || d < 1) return "";
  const check = new Date(y, m - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return "";
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseReceiptDate(text) {
  const attempts = [
    // Nov 25, 2026
    [new RegExp(`\\b${MONTH_PATTERN}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(\\d{4})\\b`, "gi"),
      (m) => toIsoDate(m[3], MONTHS[m[1].toLowerCase()], m[2])],
    // 25 Nov 2026
    [new RegExp(`\\b(\\d{1,2})\\s+${MONTH_PATTERN}\\s*,?\\s*(\\d{4})\\b`, "gi"),
      (m) => toIsoDate(m[3], MONTHS[m[2].toLowerCase()], m[1])],
    // 2026-11-25
    [/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g, (m) => toIsoDate(m[1], m[2], m[3])],
    // 11/25/2026 (month first, day first only when the first number can't be a month)
    [/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g,
      (m) => (Number(m[1]) > 12 ? toIsoDate(m[3], m[2], m[1]) : toIsoDate(m[3], m[1], m[2]))],
  ];

  for (const [pattern, build] of attempts) {
    for (const match of text.matchAll(pattern)) {
      const iso = build(match);
      if (iso) return iso;
    }
  }
  return "";
}

// Characters OCR commonly confuses with digits.
function fixDigits(value) {
  return value.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/\D/g, "");
}

export function parseReceiptReference(text) {
  const labelled = text.match(
    /\bref(?:erence)?\.?\s*(?:no|num(?:ber)?|#)?\.?\s*[:#]?\s*([0-9OoIl|][0-9OoIl| -]{6,26}[0-9OoIl|])/i
  );
  if (labelled) {
    const digits = fixDigits(labelled[1]);
    if (digits.length >= 8 && digits.length <= 20) return digits;
  }
  // GCash prints 13 digits grouped as 4-3-6 (e.g. 1234 567 890123).
  const grouped = text.match(/\b(\d{4}[ -]?\d{3}[ -]?\d{6})\b/);
  return grouped ? grouped[1].replace(/\D/g, "") : "";
}

function cleanName(value) {
  const name = value
    .replace(/[^A-Za-z.'*\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const letters = name.replace(/[^A-Za-z]/g, "");
  return letters.length >= 2 && name.length <= 60 ? name : "";
}

export function parseReceiptSenderName(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const label = "(?:sender(?:'s)?(?:\\s+name)?|sent\\s+by|from|account\\s+name)";
  const withValue = new RegExp(`^${label}\\s*[:\\-]\\s*(.+)$`, "i");
  const labelOnly = new RegExp(`^${label}\\s*[:\\-]?$`, "i");

  for (let index = 0; index < lines.length; index += 1) {
    const inline = lines[index].match(withValue);
    const candidate = inline ? inline[1] : labelOnly.test(lines[index]) ? lines[index + 1] || "" : "";
    const name = cleanName(candidate);
    if (name) return name;
  }
  return "";
}

export function parseGcashReceiptText(text) {
  const source = String(text || "");
  return {
    referenceNumber: parseReceiptReference(source),
    paymentDate: parseReceiptDate(source),
    senderName: parseReceiptSenderName(source),
  };
}

/**
 * Runs OCR on a receipt image and returns the values it could detect. Fields that were not
 * detected are returned as empty strings.
 * @param {File} file
 * @param {(progress: number) => void} [onProgress] 0–100 while the image is being read
 */
export async function scanGcashReceipt(file, onProgress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text" && onProgress) {
        onProgress(Math.round(message.progress * 100));
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return parseGcashReceiptText(data.text);
  } finally {
    await worker.terminate().catch(() => {});
  }
}
