import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  CalendarDays,
  Filter,
  Wallet,
  FileText,
  Clock3,
  CheckCircle2,
  RotateCcw,
  Settings2,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import config from "../config/config";

const GROUP_BY_OPTIONS = [
  { value: "DAY", label: "Day" },
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
];

const quickRanges = [
  { label: "7D", key: "7D" },
  { label: "30D", key: "30D" },
  { label: "This Month", key: "THIS_MONTH" },
  { label: "YTD", key: "YTD" },
];

export default function LandingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getToday());
  const [groupBy, setGroupBy] = useState("DAY");
  const [recentLimit] = useState(10);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const fetchDashboard = async ({
    from = fromDate,
    to = toDate,
    group = groupBy,
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const userId = user?.id;
      if (!userId) {
        throw new Error("No logged-in user found. Please login again.");
      }

      const resp = await axios.get(
        `${config.apiBaseUrl}/visa/dashboard/user/${userId}`,
        {
          params: {
            from,
            to,
            groupBy: group,
            recentLimit,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setData(resp.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFromChange = async (value) => {
    const adjustedFrom = value;
    let adjustedTo = toDate;

    if (adjustedFrom > adjustedTo) {
      adjustedTo = adjustedFrom;
      setToDate(adjustedTo);
    }

    setFromDate(adjustedFrom);
    await fetchDashboard({
      from: adjustedFrom,
      to: adjustedTo,
      group: groupBy,
    });
  };

  const handleToChange = async (value) => {
    const adjustedTo = value;
    let adjustedFrom = fromDate;

    if (adjustedTo < adjustedFrom) {
      adjustedFrom = adjustedTo;
      setFromDate(adjustedFrom);
    }

    setToDate(adjustedTo);
    await fetchDashboard({
      from: adjustedFrom,
      to: adjustedTo,
      group: groupBy,
    });
  };

  const handleGroupByChange = async (value) => {
    setGroupBy(value);
    await fetchDashboard({
      from: fromDate,
      to: toDate,
      group: value,
    });
  };

  const applyQuickRange = async (key) => {
    const today = getToday();

    if (key === "7D") {
      const from = subtractDays(today, 6);
      setFromDate(from);
      setToDate(today);
      setGroupBy("DAY");
      await fetchDashboard({ from, to: today, group: "DAY" });
      return;
    }

    if (key === "30D") {
      const from = subtractDays(today, 29);
      setFromDate(from);
      setToDate(today);
      setGroupBy("DAY");
      await fetchDashboard({ from, to: today, group: "DAY" });
      return;
    }

    if (key === "THIS_MONTH") {
      const from = getFirstDayOfMonth();
      setFromDate(from);
      setToDate(today);
      setGroupBy("DAY");
      await fetchDashboard({ from, to: today, group: "DAY" });
      return;
    }

    if (key === "YTD") {
      const from = getFirstDayOfYear();
      setFromDate(from);
      setToDate(today);
      setGroupBy("MONTH");
      await fetchDashboard({ from, to: today, group: "MONTH" });
    }
  };

  const kpis = data?.kpis || {};
  const trend = data?.trend || [];
  const byType = data?.byType || [];
  const byPurchaseMethod = data?.byPurchaseMethod || [];
  const recent = data?.recent || [];

  const chartData = trend.map((item, index) => ({
    id: index,
    label: formatTrendBucket(item.bucket, groupBy, index),
    total: Number(item.total || 0),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <PremiumHeroHeader
          userName={user?.name}
          loading={loading}
          onRefresh={() => fetchDashboard()}
        />

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-sm">
            <div className="font-semibold mb-1">Unable to load dashboard</div>
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <PremiumCard
            title="Date Coverage"
            subtitle="Filter your dashboard to focus on the dates and view that matter most."
            icon={<Filter className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {quickRanges.map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => applyQuickRange(range.key)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    From
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => handleFromChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    To
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => handleToChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Group By
                  </label>
                  <div className="relative">
                    <Settings2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={groupBy}
                      onChange={(e) => handleGroupByChange(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    >
                      {GROUP_BY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              title="Total Spend"
              value={formatCurrency(kpis.totalSpend || 0)}
              icon={<Wallet className="h-5 w-5" />}
              accent="from-blue-600 to-cyan-500"
            />
            <KpiCard
              title="Submitted"
              value={kpis.submittedCount ?? 0}
              icon={<FileText className="h-5 w-5" />}
              accent="from-slate-700 to-slate-500"
            />
            <KpiCard
              title="Pending"
              value={kpis.pendingCount ?? 0}
              icon={<Clock3 className="h-5 w-5" />}
              accent="from-amber-500 to-orange-500"
            />
            <KpiCard
              title="Approved"
              value={kpis.approvedCount ?? 0}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accent="from-emerald-500 to-green-600"
            />
            <KpiCard
              title="Returned"
              value={kpis.returnedCount ?? 0}
              icon={<RotateCcw className="h-5 w-5" />}
              accent="from-rose-500 to-red-500"
            />
            <KpiCard
              title="Processing"
              value={kpis.forProcessingCount ?? 0}
              icon={<TrendingUp className="h-5 w-5" />}
              accent="from-violet-500 to-purple-600"
            />
          </div>

          <PremiumCard
            title="Spending Trend"
            subtitle="Track how your expenses are moving across the selected time period."
            icon={<TrendingUp className="h-5 w-5" />}
          >
            <div className="h-[320px] w-full">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      stroke="#CBD5E1"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      stroke="#CBD5E1"
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Spend"]}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="No trend data available for the selected period." />
              )}
            </div>
          </PremiumCard>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PremiumCard
              title="By Type"
              subtitle="Expense totals grouped by type."
              icon={<FileText className="h-5 w-5" />}
            >
              <BreakdownList items={byType} />
            </PremiumCard>

            <PremiumCard
              title="By Purchase Method"
              subtitle="Expense totals grouped by purchase method."
              icon={<CreditCard className="h-5 w-5" />}
            >
              <BreakdownList items={byPurchaseMethod} />
            </PremiumCard>
          </div>

          <PremiumCard
            title="Recent Expenses"
            subtitle="Your latest submitted expenses based on the selected dashboard filters."
            icon={<Clock3 className="h-5 w-5" />}
          >
            {recent.length ? (
              <div className="space-y-3">
                {recent.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {item.typeName || "-"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {(item.departmentName || "-") + " • " + formatDisplayDate(item.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(item.priceWithTax || 0)}
                        </div>
                      </div>
                      <StatusBadge status={item.statusCode} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No recent expenses found." />
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
}

function PremiumHeroHeader({ userName, loading, onRefresh }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
            User Dashboard
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back{userName ? `, ${userName}` : ""}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
            Monitor spend, track approvals, and review recent activity in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh dashboard"}
        </button>
      </div>
    </div>
  );
}

function PremiumCard({ title, subtitle, icon, children }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function KpiCard({ title, value, icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

function BreakdownList({ items }) {
  if (!items.length) {
    return <EmptyState text="No breakdown data available." />;
  }

  const maxTotal = Math.max(...items.map((x) => Number(x.total || 0)), 1);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const total = Number(item.total || 0);
        const percent = Math.max((total / maxTotal) * 100, 4);

        return (
          <div key={`${item.name}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-medium text-slate-700">
                {item.name || "-"}
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {formatCurrency(total)}
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = (status || "").toUpperCase();

  let classes =
    "bg-slate-100 text-slate-700 border-slate-200";

  if (normalized === "APPROVED") {
    classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (normalized === "DECLINED" || normalized === "RETURNED") {
    classes = "bg-red-50 text-red-700 border-red-200";
  } else if (normalized === "FOR_PROCESSING") {
    classes = "bg-violet-50 text-violet-700 border-violet-200";
  } else if (normalized === "PENDING") {
    classes = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {normalized || "UNKNOWN"}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      {text}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0));
}

function formatDisplayDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function getToday() {
  const today = new Date();
  return toInputDate(today);
}

function getFirstDayOfMonth() {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getFirstDayOfYear() {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), 0, 1));
}

function subtractDays(inputDate, days) {
  const date = new Date(inputDate);
  date.setDate(date.getDate() - days);
  return toInputDate(date);
}

function toInputDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTrendBucket(bucket, groupBy, index) {
  if (!bucket) return `Point ${index + 1}`;

  if (groupBy === "MONTH") {
    const parts = bucket.split("-");
    if (parts.length >= 2) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const d = new Date(year, month, 1);

      if (!Number.isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-CA", {
          month: "short",
          year: "2-digit",
        }).format(d);
      }
    }
    return bucket;
  }

  if (groupBy === "WEEK") {
    const d = new Date(bucket);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "2-digit",
      }).format(d);
    }
    return bucket;
  }

  const d = new Date(bucket);
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "2-digit",
    }).format(d);
  }

  return bucket;
}