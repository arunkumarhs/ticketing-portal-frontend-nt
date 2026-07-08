import React, { useEffect, useState } from "react";
import { ticketReportAPI } from "../../api/ticketReportAPI ";
import {
  List,
  Filter,
  Eye,
  Download,
  CheckCircle2,
  Clock3,
  XCircle,
  UserX,
  FileSpreadsheet,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx-js-style";

const GetTicketReports = () => {
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  const [filters, setFilters] = useState({
    application: "ALL",
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    const loadInitialReports = async () => {
      await fetchReports();
    };

    loadInitialReports();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await ticketReportAPI.getApplicationDetails();
        setApplications(data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const data = await ticketReportAPI.getTicketReports({
        application: filters.application || "ALL",
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });

      setReports(data || []);
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;

    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  // Tailwind classes for on-screen badges
  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
      case "closed":
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
      case "pending":
      case "inprogress":
      case "in progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  // RGB hex used for PDF/Excel badges (kept in sync with Tailwind colors above)
  const getStatusColorHex = (status) => {
    switch ((status || "").toLowerCase()) {
      case "open":
        return { bg: "FEF9C3", text: "854D0E" }; // yellow
      case "closed":
      case "completed":
        return { bg: "DCFCE7", text: "15803D" }; // green
      case "pending":
      case "inprogress":
      case "in progress":
        return { bg: "DBEAFE", text: "1D4ED8" }; // blue
      case "rejected":
        return { bg: "FEE2E2", text: "B91C1C" }; // red
      default:
        return { bg: "F3F4F6", text: "374151" }; // gray
    }
  };

  const totalTickets = reports.length;

  const completedTickets = reports.filter((t) =>
    ["closed", "completed"].includes((t.status || "").toLowerCase()),
  ).length;

  const inProgressTickets = reports.filter((t) =>
    ["inprogress", "in progress", "open"].includes(
      (t.status || "").toLowerCase(),
    ),
  ).length;

  const rejectedTickets = reports.filter(
    (t) => (t.status || "").toLowerCase() === "rejected",
  ).length;

  const yetToAssignTickets = reports.filter(
    (t) =>
      !t.assignedTo &&
      !t.assignedToEmp &&
      (!t.customer || t.customer.trim() === ""),
  ).length;

  const stats = [
    {
      title: "Total Tickets",
      value: totalTickets,
      subtitle: "All generated tickets",
      icon: List,
      iconColor: "text-blue-500 bg-blue-100 dark:bg-blue-500/10",
    },
    {
      title: "Completed",
      value: completedTickets,
      subtitle: "Successfully resolved",
      icon: CheckCircle2,
      iconColor: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10",
    },
    {
      title: "In Progress",
      value: inProgressTickets,
      subtitle: "Currently working",
      icon: Clock3,
      iconColor: "text-yellow-500 bg-yellow-100 dark:bg-yellow-500/10",
    },
    {
      title: "Rejected",
      value: rejectedTickets,
      subtitle: "Not approved tickets",
      icon: XCircle,
      iconColor: "text-red-500 bg-red-100 dark:bg-red-500/10",
    },
    {
      title: "Yet To Assign",
      value: yetToAssignTickets,
      subtitle: "Waiting for assignment",
      icon: UserX,
      iconColor: "text-purple-500 bg-purple-100 dark:bg-purple-500/10",
    },
  ];

  // ---------------- PDF EXPORT ----------------
  const handleDownloadPDF = () => {
    try {
      if (!reports.length) {
        console.warn("No reports to export");
        return;
      }

      const doc = new jsPDF("l", "mm", "a4"); // landscape for more room
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(16);
      doc.setTextColor(20, 100, 90);
      doc.text("Ticket Reports", 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated on ${formatDate(new Date())}`, 14, 21);
      doc.text(`Total records: ${reports.length}`, pageWidth - 14, 21, {
        align: "right",
      });

      const tableColumn = [
        "ID",
        "App",
        "Title",
        "Description",
        "Customer",
        "Created By",
        "Status",
        "Date",
      ];

      const tableRows = reports.map((t) => [
        t.id,
        t.application,
        t.title,
        t.description,
        t.customer || "-",
        t.createdBy,
        t.status,
        formatDate(t.docDate),
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 26,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
          valign: "middle",
          lineColor: [225, 225, 225],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [13, 148, 136], // teal-600
          textColor: 255,
          fontStyle: "bold",
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [247, 250, 249],
        },
        columnStyles: {
          0: { cellWidth: 14 }, // ID
          1: { cellWidth: 24 }, // App
          2: { cellWidth: 38 }, // Title
          3: { cellWidth: "auto" }, // Description (flexes)
          4: { cellWidth: 28 }, // Customer
          5: { cellWidth: 28 }, // Created By
          6: { cellWidth: 22 }, // Status
          7: { cellWidth: 22 }, // Date
        },
        // Color the status cell text/background per row
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const { bg, text } = getStatusColorHex(data.cell.raw);
            data.cell.styles.fillColor = hexToRgbArray(bg);
            data.cell.styles.textColor = hexToRgbArray(text);
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";
          }
        },
        didDrawPage: (data) => {
          // Footer: page number
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
            pageWidth - 20,
            doc.internal.pageSize.getHeight() - 8,
          );
        },
        margin: { left: 14, right: 14 },
      });

      doc.save("ticket-reports.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  const hexToRgbArray = (hex) => {
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  // ---------------- EXCEL EXPORT ----------------
  const handleDownloadExcel = () => {
    try {
      if (!reports.length) {
        console.warn("No reports to export");
        return;
      }

      const headers = [
        "ID",
        "Application",
        "Title",
        "Description",
        "Customer",
        "Created By",
        "Status",
        "Date",
      ];

      const rows = reports.map((t) => [
        t.id,
        t.application,
        t.title,
        t.description,
        t.customer || "-",
        t.createdBy,
        t.status,
        formatDate(t.docDate),
      ]);

      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Column widths
      worksheet["!cols"] = [
        { wch: 8 },  // ID
        { wch: 16 }, // Application
        { wch: 24 }, // Title
        { wch: 45 }, // Description
        { wch: 18 }, // Customer
        { wch: 18 }, // Created By
        { wch: 14 }, // Status
        { wch: 14 }, // Date
      ];

      // Freeze header row
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
      worksheet["!views"] = [{ state: "frozen", ySplit: 1 }];

      const headerStyle = {
        fill: { fgColor: { rgb: "0D9488" } }, // teal-600
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "0F766E" } },
        },
      };

      const baseCellStyle = {
        alignment: { vertical: "center", wrapText: true },
        border: {
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };

      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      // Style header row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = headerStyle;
        }
      }

      // Style body rows: base style + status color + alternating row shade
      for (let row = 1; row <= range.e.r; row++) {
        const isEven = row % 2 === 0;
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellRef]) continue;

          let cellStyle = {
            ...baseCellStyle,
            fill: isEven
              ? { fgColor: { rgb: "F7FAF9" } }
              : { fgColor: { rgb: "FFFFFF" } },
          };

          // Status column index = 6
          if (col === 6) {
            const { bg, text } = getStatusColorHex(worksheet[cellRef].v);
            cellStyle = {
              ...cellStyle,
              fill: { fgColor: { rgb: bg } },
              font: { color: { rgb: text }, bold: true },
              alignment: { horizontal: "center", vertical: "center" },
            };
          }

          worksheet[cellRef].s = cellStyle;
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ticket Reports");

      XLSX.writeFile(workbook, "ticket-reports.xlsx");
    } catch (err) {
      console.error("Excel generation failed:", err);
    }
  };

  return (
    <div className="px-3 py-3 animate-fadeIn">
      {/* HEADER */}
      <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-teal-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-500 shadow-md">
            <List className="h-4 w-4 text-white" />
          </div>

          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">
              Ticket Reports
            </h1>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">
              Filter, analyze and export ticket data
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {stats.map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex flex-col leading-tight">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.value}
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-wrap gap-3 items-end mb-4">
        <select
          value={filters.application}
          onChange={(e) =>
            setFilters((p) => ({ ...p, application: e.target.value }))
          }
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-auto"
        >
          <option value="ALL">All Applications</option>
          {applications.map((app, i) => (
            <option key={i} value={app.application}>
              {app.application}
            </option>
          ))}
        </select>

        <DatePicker
          selected={filters.fromDate ? new Date(filters.fromDate) : null}
          onChange={(date) =>
            setFilters((p) => ({
              ...p,
              fromDate: date ? date.toISOString().split("T")[0] : "",
            }))
          }
          placeholderText="From Date"
          dateFormat="dd/MM/yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          wrapperClassName="inline-block"
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-[140px]"
        />

        <DatePicker
          selected={filters.toDate ? new Date(filters.toDate) : null}
          onChange={(date) =>
            setFilters((p) => ({
              ...p,
              toDate: date ? date.toISOString().split("T")[0] : "",
            }))
          }
          placeholderText="To Date"
          dateFormat="dd/MM/yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          wrapperClassName="inline-block"
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-[140px]"
        />

        <button
          onClick={fetchReports}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow h-[38px] w-auto transition-colors"
        >
          <Filter size={14} />
          Generate
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg shadow h-[38px] transition-colors"
        >
          <Download size={14} />
          Download PDF
        </button>
        <button
          onClick={handleDownloadExcel}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg shadow h-[38px] transition-colors"
        >
          <FileSpreadsheet size={14} />
          Export to Sheets
        </button>
      </div>

      {/* TABLE CARD */}
      <div
        ref={reportRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600">
              <tr className="text-left text-gray-600 dark:text-gray-300 uppercase text-[11px] tracking-wide">
                <th className="p-3 font-semibold w-[70px]">ID</th>
                <th className="p-3 font-semibold w-[110px]">App</th>
                <th className="p-3 font-semibold w-[160px]">Title</th>
                <th className="p-3 font-semibold min-w-[320px]">
                  Description
                </th>
                <th className="p-3 font-semibold w-[130px]">Customer</th>
                <th className="p-3 font-semibold w-[130px]">Created By</th>
                <th className="p-3 font-semibold w-[110px] text-center">
                  Status
                </th>
                <th className="p-3 font-semibold w-[100px]">Date</th>
                <th className="p-3 font-semibold w-[60px] text-center">
                  File
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center p-8 text-gray-500 dark:text-gray-400"
                  >
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center p-8 text-gray-500 dark:text-gray-400"
                  >
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50/50 dark:bg-gray-800/60"
                    }`}
                  >
                    <td className="p-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                      {t.id}
                    </td>
                    <td className="p-3 whitespace-nowrap">{t.application}</td>
                    <td className="p-3 max-w-[200px] truncate" title={t.title}>
                      {t.title}
                    </td>
                    <td className="p-3 min-w-[320px] max-w-[520px] break-words text-gray-600 dark:text-gray-400">
                      {t.description}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {t.customer || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">{t.createdBy}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusStyle(
                          t.status,
                        )}`}
                      >
                        {t.status || "-"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {formatDate(t.docDate)}
                    </td>
                    <td className="p-3 text-center">
                      {t.filePath ? (
                        <a
                          href={t.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150"
                        >
                          <Eye size={15} />
                        </a>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {reports.length > 0 && (
          <div className="px-4 py-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
            Showing {reports.length} record{reports.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetTicketReports;