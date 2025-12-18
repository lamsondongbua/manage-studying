// utils/date.ts

// ✅ Hiển thị ngày cho user (18/12/2024)
export const formatDateVN = (
  dateStr: string | Date,
  options?: Intl.DateTimeFormatOptions
) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);

  // Kiểm tra Invalid Date
  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    ...options,
  });
};

// ✅ Format ISO để so sánh (2024-12-18)
export const formatDateVNISO = (dateStr: string | Date) => {
  const date = new Date(dateStr);

  // Convert to Vietnam timezone
  const vnDateStr = date.toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const vnDate = new Date(vnDateStr);

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`; // ISO format
};
