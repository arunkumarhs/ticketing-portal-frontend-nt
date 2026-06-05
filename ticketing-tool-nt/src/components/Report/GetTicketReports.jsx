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
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

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

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-700";
      case "closed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

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

      doc.setFontSize(14);
      doc.text("Ticket Reports", 14, 15);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [20, 184, 166], // teal color
          textColor: 255,
        },
      });

      doc.save("ticket-reports.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-500 shadow">
          <List className="text-white w-5 h-5" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Ticket Reports
          </h1>
          <p className="text-xs text-gray-500">
            Filter, analyze and export ticket data
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {stats.map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              className="
          flex items-center gap-3
          min-w-[150px]
          rounded-lg
          px-3 py-2
          bg-white dark:bg-gray-800
          border border-gray-100 dark:border-gray-700
          shadow-sm
          hover:shadow-md transition
        "
            >
              {/* ICON */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.iconColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* TEXT */}
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-wrap gap-3 items-end">
        {/* Application */}
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

        {/* From Date */}
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

        {/* To Date */}
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

        {/* Button */}
        <button
          onClick={fetchReports}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow h-[38px] w-auto"
        >
          <Filter size={14} />
          Generate
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg shadow h-[38px]"
        >
          <Download size={14} />
          Download PDF
        </button>
      </div>

      {/* TABLE CARD */}
      <div
        ref={reportRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-visible"
      >
        <div className="overflow-x-auto relative z-0">
          <table className="w-full text-sm table-auto text-gray-700 dark:text-gray-300">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                {[
                  "ID",
                  "App",
                  "Title",
                  "Description",
                  "Customer",
                  "Created By",
                  "Status",
                  "Date",
                  "File",
                ].map((label) => (
                  <th
                    key={label}
                    className="p-3 whitespace-nowrap font-semibold"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center p-6 text-gray-500 dark:text-gray-400"
                  >
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center p-6 text-gray-500 dark:text-gray-400"
                  >
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="p-3 whitespace-nowrap">{t.id}</td>
                    <td className="p-3 whitespace-nowrap">{t.application}</td>

                    <td className="p-3 min-w-[180px]">{t.title}</td>

                    <td className="p-3 min-w-[420px] max-w-[600px] break-words">
                      {t.description}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {t.customer || "-"}
                    </td>

                    <td className="p-3 whitespace-nowrap">{t.createdBy}</td>

                    <td className="p-2 whitespace-nowrap">
                      <span className="px-2 py-[2px] rounded-md">
                        {t.status}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {formatDate(t.docDate)}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {t.filePath ? (
                        <a
                          href={t.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center text-gray-500 dark:text-gray-300
             hover:text-blue-600 dark:hover:text-blue-400
             transition-colors duration-150"
                        >
                          <Eye size={15} />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GetTicketReports;
