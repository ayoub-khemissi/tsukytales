export function validateSort(
  sortBy: string | null | undefined,
  sortOrder: string | null | undefined,
  allowedColumns: string[],
): { orderBy: string } | null {
  if (!sortBy || !allowedColumns.includes(sortBy)) return null;

  const direction = sortOrder === "asc" ? "ASC" : "DESC";

  return { orderBy: `${sortBy} ${direction}` };
}
