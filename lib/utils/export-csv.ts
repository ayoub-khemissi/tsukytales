/**
 * Generate and download a CSV file with UTF-8 BOM for Excel compatibility.
 */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: string[][],
) {
  const BOM = "\uFEFF";
  const escape = (val: string) => {
    const s = String(val ?? "");

    if (
      s.includes('"') ||
      s.includes(";") ||
      s.includes("\n") ||
      s.includes("\r")
    ) {
      return `"${s.replace(/"/g, '""')}"`;
    }

    return s;
  };
  const lines = [
    headers.map(escape).join(";"),
    ...rows.map((row) => row.map(escape).join(";")),
  ];
  const csv = lines.join("\r\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
