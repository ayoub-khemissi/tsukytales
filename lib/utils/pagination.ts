export function getPagination(page?: number | string, size?: number | string) {
  const limit = size ? +size : 10;
  const p = page ? Math.max(1, +page) : 1;
  const offset = (p - 1) * limit;

  return { limit, offset };
}

export function getPagingData<T>(
  items: T[],
  totalItems: number,
  page?: number | string,
  limit?: number,
) {
  const currentPage = page ? Math.max(1, +page) : 1;
  const effectiveLimit = limit ?? 10;
  const totalPages = Math.ceil(totalItems / effectiveLimit);

  return { totalItems, items, totalPages, currentPage };
}
