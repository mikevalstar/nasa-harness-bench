export function dateToJd(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

export function jdToDate(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

export function formatJd(jd) {
  return `JD ${jd.toFixed(3)}`;
}

export function formatDate(jd) {
  const d = jdToDate(jd);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm} UTC`;
}

export function toDatetimeLocal(jd) {
  const d = jdToDate(jd);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function fromDatetimeLocal(value) {
  if (!value) return dateToJd(new Date());
  const [date, time] = value.split("T");
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  return dateToJd(new Date(Date.UTC(y, mo - 1, d, hh || 0, mm || 0)));
}
