import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Timer,
  UserX,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { ticketAPI } from "../../api/ticketAPI";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// SLA Report
// A dedicated, reporting-focused view of ticket SLA health: how many tickets
// are on track, breached, overdue, or still waiting to be picked up — with
// date-range + project filters and PDF / Excel export.
// ---------------------------------------------------------------------------

const SLA_HOURS = {
  low: 72,
  medium: 48,
  high: 24,
  critical: 12,
};

// Statuses that "close" a ticket. Once a ticket is in one of these states,
// its SLA clock should stop counting against Date.now() and instead freeze
// at the moment it was resolved.
const TERMINAL_STATUSES = ["Completed", "Rejected"];

const SLAReport = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const role = user?.type?.toLowerCase();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setNow] = useState(Date.now());

  const [filters, setFilters] = useState({
    project: "",
    dateFrom: "",
    dateTo: "",
    slaStatus: "",
  });

  // live-refresh the countdown clocks
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // pull ticket data, scoped to the signed-in role (same rule as AllTickets)
  useEffect(() => {
    if (!user) return;

    const fetchTickets = async () => {
      try {
        const all = await ticketAPI.getAllTickets();
        const normalized = all.map((t) => ({
          ...t,
          assignedToEmp: t.email || t.assignedToEmp || "",
          companyName: t.companyName || t.company || "",
        }));

        const visible =
          role === "admin"
            ? normalized
            : role === "employee"
              ? normalized.filter(
                  (t) =>
                    t.assignedToEmp === user.email ||
                    t.assignedToEmp === user.name,
                )
              : role === "customer"
                ? normalized.filter(
                    (t) =>
                      t.createdBy === user.email || t.createdBy === user.name,
                  )
                : [];

        setTickets(visible);
      } catch (err) {
        console.error(err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchTickets();
    const poll = setInterval(fetchTickets, 15000);
    return () => clearInterval(poll);
  }, [role, user]);

  // ---- SLA math --------------------------------------------------------

  // Your ticket objects may return the "last updated" timestamp under different
  // field names depending on the API response. Check the common variants so
  // "Resolved On" doesn't silently stay blank if the field isn't modifiedDate.
  const RESOLVED_DATE_FIELDS = [
    "resolvedDate",
    "resolvedOn",
    "completedDate",
    "completionDate",
    "closedDate",
    "closedOn",
    "modifiedDate",
    "modifiedOn",
    "updatedDate",
    "updatedAt",
    "lastModified",
    "lastModifiedDate",
    "statusUpdatedDate",
    "statusChangedDate",
  ];

  const getResolvedTimestamp = (ticket) => {
    for (const field of RESOLVED_DATE_FIELDS) {
      const value = ticket[field];
      if (!value) continue;
      const parsed = new Date(value).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  const getSLAInfo = (ticket) => {
    const slaHours = SLA_HOURS[(ticket.priority || "").toLowerCase()] || 24;
    const slaMs = slaHours * 60 * 60 * 1000;

    if (!ticket.docDate) {
      return {
        slaHours,
        overdue: false,
        remainingMs: null,
        elapsedMs: null,
        dueDate: null,
        consumedPct: null,
        resolvedDate: null,
        statusLabel: "No SLA",
        statusKey: "none",
      };
    }

    const created = new Date(ticket.docDate).getTime();
    const dueDate = created + slaMs;
    const isClosed = TERMINAL_STATUSES.includes(ticket.status);

    // For closed tickets, stop the clock at the resolved timestamp instead of
    // continuing to measure against "now". Prefer completedOn (explicit field
    // used elsewhere in the app), but fall back to the other resolved-date
    // field variants the API might send (see RESOLVED_DATE_FIELDS above).
    const explicitCompletedOn =
      ticket.completedOn && !isNaN(new Date(ticket.completedOn).getTime())
        ? new Date(ticket.completedOn).getTime()
        : null;

    const resolvedDate = isClosed
      ? (explicitCompletedOn ?? getResolvedTimestamp(ticket))
      : null;

    const referenceTime = resolvedDate || Date.now();

    const elapsedMs = referenceTime - created;
    const remainingMs = dueDate - referenceTime;
    const overdue = remainingMs < 0;
    const consumedPct = Math.max(0, Math.round((elapsedMs / slaMs) * 100));

    let statusLabel, statusKey;

    if (!ticket.assignedToEmp || ticket.status === "YetToAssign") {
      statusLabel = "Pending Assignment";
      statusKey = "pending";
    } else if (ticket.status === "Rejected") {
      statusLabel = "Rejected";
      statusKey = "rejected";
    } else if (ticket.status === "Completed") {
      statusLabel = overdue ? "Breached" : "Met SLA";
      statusKey = overdue ? "breached" : "met";
    } else if (overdue) {
      statusLabel = "Overdue";
      statusKey = "overdue";
    } else {
      statusLabel = "On Track";
      statusKey = "ontrack";
    }

    return {
      slaHours,
      overdue,
      remainingMs,
      elapsedMs,
      dueDate,
      consumedPct,
      resolvedDate,
      statusLabel,
      statusKey,
    };
  };

  const formatDuration = (ms) => {
    if (ms === null || ms === undefined) return "-";
    const abs = Math.abs(ms);
    const totalMinutes = Math.floor(abs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0 && hours > 0) return `${days}d ${hours}h`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDateTime = (dateMs) => {
    if (!dateMs) return "-";
    const d = new Date(dateMs);
    if (isNaN(d)) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${mins}`;
  };

  const STATUS_STYLES = {
    met: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    ontrack:
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    overdue:
      "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20",
    breached:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
    pending:
      "bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/20",
    rejected:
      "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/10",
    none: "bg-gray-500/10 text-gray-500 border border-gray-500/10",
  };

  // ---- Filtering ---------------------------------------------------------

  const projectOptions = useMemo(() => {
    const set = new Set(tickets.map((t) => t.application).filter(Boolean));
    return Array.from(set).sort();
  }, [tickets]);

  const enrichedTickets = useMemo(
    () => tickets.map((t) => ({ ...t, sla: getSLAInfo(t) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    return enrichedTickets.filter((t) => {
      if (filters.project && t.application !== filters.project) return false;
      if (filters.slaStatus && t.sla.statusKey !== filters.slaStatus)
        return false;

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
        const created = t.docDate ? new Date(t.docDate).getTime() : null;
        if (!created || created < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).setHours(23, 59, 59, 999);
        const created = t.docDate ? new Date(t.docDate).getTime() : null;
        if (!created || created > to) return false;
      }
      return true;
    });
  }, [enrichedTickets, filters]);

  const clearFilters = () =>
    setFilters({ project: "", dateFrom: "", dateTo: "", slaStatus: "" });

  const hasActiveFilters =
    filters.project || filters.dateFrom || filters.dateTo || filters.slaStatus;

  // ---- Summary stats ------------------------------------------------------

  const counts = useMemo(() => {
    const base = {
      total: filteredTickets.length,
      met: 0,
      breached: 0,
      ontrack: 0,
      overdue: 0,
      pending: 0,
    };
    filteredTickets.forEach((t) => {
      if (base[t.sla.statusKey] !== undefined) base[t.sla.statusKey] += 1;
    });
    return base;
  }, [filteredTickets]);

  const closedForSLA = counts.met + counts.breached;
  const compliancePct =
    closedForSLA > 0 ? Math.round((counts.met / closedForSLA) * 100) : null;

  const stats = [
    {
      title: "Total in View",
      value: counts.total,
      subtitle: "Matching current filters",
      icon: FileText,
      iconColor: "text-blue-500 bg-blue-100 dark:bg-blue-500/10",
    },
    {
      title: "SLA Compliance",
      value: compliancePct !== null ? `${compliancePct}%` : "-",
      subtitle: "Of completed tickets",
      icon: ShieldCheck,
      iconColor: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10",
    },
    {
      title: "On Track",
      value: counts.ontrack,
      subtitle: "Within SLA window",
      icon: Clock3,
      iconColor: "text-indigo-500 bg-indigo-100 dark:bg-indigo-500/10",
    },
    {
      title: "Overdue",
      value: counts.overdue,
      subtitle: "Past SLA, still open",
      icon: Timer,
      iconColor: "text-red-500 bg-red-100 dark:bg-red-500/10",
    },
    {
      title: "Breached",
      value: counts.breached,
      subtitle: "Completed past SLA",
      icon: ShieldAlert,
      iconColor: "text-orange-500 bg-orange-100 dark:bg-orange-500/10",
    },
    {
      title: "Pending Assign",
      value: counts.pending,
      subtitle: "SLA clock at risk",
      icon: UserX,
      iconColor: "text-purple-500 bg-purple-100 dark:bg-purple-500/10",
    },
  ];

  // ---- Export --------------------------------------------------------------

  const exportRows = () =>
    filteredTickets.map((t) => ({
      "Ticket No": t.id,
      Project: t.application || "-",
      Priority: t.priority || "-",
      "SLA Status": t.sla.statusLabel,
      "SLA Target": `${t.sla.slaHours}h`,
      "Created On": formatDateTime(
        t.docDate ? new Date(t.docDate).getTime() : null,
      ),
      "Due By": formatDateTime(t.sla.dueDate),
      Elapsed: t.sla.elapsedMs === null ? "-" : formatDuration(t.sla.elapsedMs),
      "Remaining / Overdue By":
        t.sla.remainingMs === null
          ? "-"
          : `${t.sla.overdue ? "Overdue by " : ""}${formatDuration(t.sla.remainingMs)}`,
      "Resolved On": t.sla.resolvedDate
        ? formatDateTime(t.sla.resolvedDate)
        : "-",
    }));

  const exportToExcel = () => {
    const rows = exportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SLA Report");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `SLA_Report_${stamp}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const stamp = new Date().toISOString().slice(0, 10);

    doc.setFontSize(14);
    doc.text("SLA Report", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);

    const filterBits = [];
    if (filters.project) filterBits.push(`Project: ${filters.project}`);
    if (filters.dateFrom) filterBits.push(`From: ${filters.dateFrom}`);
    if (filters.dateTo) filterBits.push(`To: ${filters.dateTo}`);
    if (filters.slaStatus) filterBits.push(`SLA Status: ${filters.slaStatus}`);
    doc.text(
      filterBits.length ? filterBits.join("   |   ") : "All tickets",
      14,
      21,
    );
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    const rows = exportRows().map((r) => Object.values(r));

    autoTable(doc, {
      startY: 31,
      head: [
        Object.keys(
          exportRows()[0] || {
            "Ticket No": "",
            Project: "",
            Priority: "",
            "SLA Status": "",
            "SLA Target": "",
            "Created On": "",
            "Due By": "",
            Elapsed: "",
            "Remaining / Overdue By": "",
            "Resolved On": "",
          },
        ),
      ],
      body: rows,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`SLA_Report_${stamp}.pdf`);
  };

  // ---------------------------------------------------------------------

  if (loading)
    return (
      <p className="text-center mt-10 animate-fadeIn">Loading SLA report...</p>
    );

  return (
    <div className="animate-fadeIn px-3 py-3">
      <button
        onClick={() => navigate("/menu/ticket")}
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-3 animate-slideUp"
      >
        <ArrowLeft size={14} />
        <span className="text-xs">Back to Ticket Management</span>
      </button>

      {/* Header */}
      <div className="relative mb-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 animate-slideUp">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold dark:text-white">SLA Report</h1>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                Track turnaround performance against SLA targets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={!filteredTickets.length}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              disabled={!filteredTickets.length}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 shadow-sm animate-slideUp">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">
            <Filter size={13} />
            Filters
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              Project / App
            </label>
            <select
              value={filters.project}
              onChange={(e) =>
                setFilters((f) => ({ ...f, project: e.target.value }))
              }
              className="text-xs border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 min-w-[140px]"
            >
              <option value="">All Projects</option>
              {projectOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
              className="text-xs border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
              className="text-xs border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              SLA Status
            </label>
            <select
              value={filters.slaStatus}
              onChange={(e) =>
                setFilters((f) => ({ ...f, slaStatus: e.target.value }))
              }
              className="text-xs border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 min-w-[130px]"
            >
              <option value="">All Statuses</option>
              <option value="ontrack">On Track</option>
              <option value="overdue">Overdue</option>
              <option value="met">Met SLA</option>
              <option value="breached">Breached</option>
              <option value="pending">Pending Assignment</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-500 dark:text-gray-400 pb-2"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {item.value}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 animate-slideUp">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200/60 dark:border-white/10">
              <th className="w-[70px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Ticket No
              </th>
              <th className="w-[100px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Project
              </th>
              <th className="w-[80px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Priority
              </th>
              <th className="w-[120px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                SLA Status
              </th>
              <th className="w-[75px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                SLA Target
              </th>
              <th className="w-[110px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Created On
              </th>
              <th className="w-[110px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Due By
              </th>
              <th className="w-[85px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Elapsed
              </th>
              <th className="w-[130px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Remaining / Overdue
              </th>
              <th className="w-[110px] pb-3 pt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left px-2">
                Resolved On
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, index) => (
              <tr
                key={t.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className="border-b border-gray-100/60 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-200 animate-fadeIn"
              >
                <td className="px-2 py-3 text-xs text-gray-700 dark:text-gray-300 truncate">
                  <div className="font-medium">{t.id}</div>
                  <div
                    className="truncate max-w-[130px] text-[10px] text-gray-400 dark:text-gray-500"
                    title={t.title}
                  >
                    {t.title}
                  </div>
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {t.application || "-"}
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate capitalize">
                  {t.priority || "-"}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded-md text-[10px] font-semibold ${STATUS_STYLES[t.sla.statusKey]}`}
                  >
                    {t.sla.statusLabel}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {t.sla.slaHours}h
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {formatDateTime(
                    t.docDate ? new Date(t.docDate).getTime() : null,
                  )}
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {formatDateTime(t.sla.dueDate)}
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {t.sla.elapsedMs === null
                    ? "-"
                    : formatDuration(t.sla.elapsedMs)}
                </td>
                <td className="px-2 py-3 text-xs truncate">
                  <span
                    className={
                      t.sla.overdue
                        ? "text-red-500 font-medium"
                        : "text-gray-600 dark:text-gray-300"
                    }
                  >
                    {t.sla.remainingMs === null
                      ? "-"
                      : `${t.sla.overdue ? "Overdue by " : ""}${formatDuration(t.sla.remainingMs)}`}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
                  {t.sla.resolvedDate
                    ? formatDateTime(t.sla.resolvedDate)
                    : "-"}
                </td>
              </tr>
            ))}

            {!filteredTickets.length && (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-8 text-xs text-gray-500 dark:text-gray-400"
                >
                  No tickets match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Animations (shared with the rest of the ticket module) */
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default SLAReport;
