import dayjs from "dayjs";
import {
  dayFormat,
  dayMonthFormat,
  fullDateTimeFormat,
  timeFormat,
} from "@/utils/timeFormatting";

const isToday = (date: string) => {
  return dayjs().isSame(date, "day");
};
const isYesterday = (date: string) => {
  return dayjs().subtract(1, "day").isSame(date, "day");
};
const isSameMonth = (data: string) => {
  return dayjs().isSame(data, "month");
};
const isSameYear = (date: string) => {
  return dayjs().isSame(date, "year");
};

export function getTime(time: string) {
  if (isToday(time)) {
    return timeFormat(time);
  } else if (isYesterday(time)) {
    return `Gisteren om ${timeFormat(time)}`;
  } else if (isSameMonth(time)) {
    return dayFormat(time);
  } else if (isSameYear(time)) {
    return dayMonthFormat(time);
  }
  return fullDateTimeFormat(time);
}
