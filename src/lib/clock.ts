/** Display calendar year in the product timezone (not the server UTC clock). */
const DISPLAY_TIME_ZONE = "Europe/Istanbul";

export function displayCalendarYear(instant: Date = new Date()): number {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
  }).format(instant);
  return Number(year);
}
