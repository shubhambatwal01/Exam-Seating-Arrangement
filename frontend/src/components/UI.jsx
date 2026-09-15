export const panel =
  "rounded-sm border border-[#0dcaf0] bg-white p-4 shadow-sm";
export const input =
  "mt-1 h-[38px] w-full rounded-[6px] border border-[#dee2e6] bg-white px-3 text-[15px] outline-none focus:border-[#86b7fe] focus:ring-[3px] focus:ring-[#0d6efd30]";
export const primary =
  "rounded-[6px] border border-[#0d6efd] px-3 py-[6px] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white disabled:opacity-50";
export const danger =
  "rounded-[6px] border border-[#dc3545] px-3 py-[6px] text-[#dc3545] hover:bg-[#dc3545] hover:text-white";

export function PageTitle({ title, description }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-medium sm:text-[30px]">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

export function Alert({ type = "error", children }) {
  if (!children) return null;
  return (
    <div
      className={`mb-4 rounded border px-3 py-2 text-sm ${type === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}
    >
      {children}
    </div>
  );
}

export function Empty({ text = "No records found." }) {
  return <div className="py-8 text-center text-sm text-slate-500">{text}</div>;
}
