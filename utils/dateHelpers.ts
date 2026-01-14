// utils/dateHelpers.ts
import dayjs from "dayjs";

// Optional: Import plugins if you need "2 hours ago" or "Yesterday"
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(calendar);

// 1. Basic Format (DD/MM/YYYY)
export const formatDate = (date: number | string | Date) => {
  return dayjs(date).format("DD/MM/YYYY");
};

// 2. Readable Format (e.g., "Jan 15, 2026")
export const formatDateReadable = (date: number | string | Date) => {
  return dayjs(date).format("MMM D, YYYY");
};

// 3. Relative Time (e.g., "2 hours ago")
export const formatRelativeTime = (date: number | string | Date) => {
  return dayjs(date).fromNow();
};

export const dateToLocalMidnightISO = (date: Date) => {
  return dayjs(date).startOf("day").toISOString();
};

export const parseISOToLocalDate = (iso: string) => {
  return dayjs(iso).toDate();
};

export default dayjs;
