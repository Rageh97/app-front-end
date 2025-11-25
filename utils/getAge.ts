import dayjs from "dayjs";

export function getAge(dateOfBirth: string | Date) {
  return dayjs().diff(dayjs(dateOfBirth), "year");
}
