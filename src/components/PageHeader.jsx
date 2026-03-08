export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-6 rounded-[28px] border border-white/60 bg-white/75 p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      {eyebrow ? (
        <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {eyebrow}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}