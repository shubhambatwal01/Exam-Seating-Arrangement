export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data = null, message = "Success", status = 200) =>
  res.status(status).json({ success: true, data, message, error: null });
export const dateOnly = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
};
export const isoDate = (value) => {
  const d = dateOnly(value);
  return d ? d.toISOString().slice(0, 10) : "";
};
export function examDays(start, end, excluded = []) {
  const a = dateOnly(start),
    b = dateOnly(end);
  if (!a || !b || a > b) return [];
  const skip = new Set(excluded.map(isoDate));
  const out = [];
  for (const d = new Date(a); d <= b; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0 && !skip.has(isoDate(d))) out.push(new Date(d));
  }
  return out;
}
