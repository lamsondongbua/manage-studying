// utils/date.ts
export const formatDateVN = (
  dateStr: string | Date,
  options?: Intl.DateTimeFormatOptions
) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    ...options,
  });
};

export const formatDateVNISO = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  // YYYY-MM-DD
  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
