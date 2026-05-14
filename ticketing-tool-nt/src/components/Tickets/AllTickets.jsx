import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Eye,
  ChevronUp,
  ChevronDown,
  Check,
  List,
  X
} from "lucide-react";
import { ticketAPI } from "../../api/ticketAPI";
import { employeeAPI } from "../../api/employeeAPI";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import TicketPopup from "./TicketPopup";
import TicketFilters from "./TicketFilters";

const AllTickets = () => {

  

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "docDate",
    direction: "desc",
  });
  const [employees, setEmployees] = useState([]);
  const [assigning, setAssigning] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  

  const recordsPerPage = 10;

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const role = user?.type?.toLowerCase();

  const [filters, setFilters] = useState({
    application: "",
    status: "",
    assignedTo: "",
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const empList = await employeeAPI.getAllEmployees();
        setEmployees(empList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const allTickets = await ticketAPI.getAllTickets();
        const normalized = allTickets.map((t) => ({
          ...t,
          assignedToEmp: t.email || t.assignedToEmp || "",
          companyName: t.companyName || t.company || "", // added companyName
        }));
        const visibleTickets =
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
        setTickets(visibleTickets);
      } catch (err) {
        console.error(err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTickets();
  }, [role, user]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // filter
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      return (
        (!filters.application || t.projectName === filters.application) &&
        (!filters.status || t.status === filters.status) &&
        (!filters.assignedTo || t.assignedToEmp === filters.assignedTo)
      );
    });
  }, [tickets, filters]);

  // sort
  const sortedTickets = useMemo(() => {
    if (!sortConfig.key) return filteredTickets;

    const sorted = [...filteredTickets].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";

      const aDate = Date.parse(aValue);
      const bDate = Date.parse(bValue);

      if (!isNaN(aDate) && !isNaN(bDate)) return aDate - bDate;
      if (typeof aValue === "string") return aValue.localeCompare(bValue);

      return (aValue || 0) - (bValue || 0);
    });

    return sortConfig.direction === "desc" ? sorted.reverse() : sorted;
  }, [filteredTickets, sortConfig]);

  useEffect(() => setCurrentPage(1), [sortConfig]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return sortedTickets.slice(start, start + recordsPerPage);
  }, [sortedTickets, currentPage]);

  const totalPages = Math.ceil(sortedTickets.length / recordsPerPage);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const handleAssignChange = async (ticketId, selectedEmail) => {
    const employee = employees.find((e) => e.email === selectedEmail);
    if (!employee) return;

    setAssigning((prev) => ({ ...prev, [ticketId]: true }));

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, assignedToEmp: employee.email } : t,
      ),
    );

    try {
      const response = await ticketAPI.assignTicket({
        id: ticketId,
        assignedToEmployee: employee.name,
        assignedTo: employee.id,
        email: employee.email,

        modifiedBy: user.name || user.email,
      });

      if (response.success) {
        setSuccessMessage(`Ticket ID - ${ticketId} assigned to ${employee.name}`);
        
      } else {
        revertAssign(ticketId);
      }
    } catch (err) {
      console.error(err);
      revertAssign(ticketId);
    } finally {
      setAssigning((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const revertAssign = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assignedToEmp: "" } : t)),
    );
  };

  const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  if (isNaN(d)) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

  const getPriorityStyle = (priority) => {
    switch ((priority || "").toLowerCase()) {
      case "normal":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };
  const handleStatusChange = async (ticketId, newStatus) => {
    const oldTickets = [...tickets];

    // optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );

    try {
      const res = await ticketAPI.changeTicketStatus({
        id: ticketId,
        status: newStatus,
        empCode: user.email,
      });

      if (res.success) {
        setSuccessMessage("Status updated successfully");
        
      } else {
        setTickets(oldTickets); // revert
      }
    } catch (err) {
      console.error(err);
      setTickets(oldTickets); // revert
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 animate-fadeIn">Loading tickets...</p>
    );

  return (
    <div className="animate-fadeIn px-6 py-6">
      {(successMessage || errorMessage) && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fadeIn">
    
    <div className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 text-center animate-slideUp border border-gray-200 dark:border-gray-700">
      
      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div
          className={`p-2.5 rounded-full ${
            successMessage
              ? "bg-green-50 dark:bg-green-500/10"
              : "bg-red-50 dark:bg-red-500/10"
          }`}
        >
          {successMessage ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {successMessage ? "Success" : "Error"}
      </h2>

      {/* Message */}
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        {successMessage || errorMessage}
      </p>

      {/* Button */}
      <button
        onClick={() => {
          setSuccessMessage("");
          setErrorMessage("");
        }}
        className={`w-full py-2 rounded-lg text-sm font-medium transition ${
          successMessage
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {successMessage ? "OK" : "Close"}
      </button>
    </div>
  </div>
)}

      <button
        onClick={() => navigate("/menu/ticket")}
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-3 animate-slideUp"
      >
        <ArrowLeft size={14} />
        <span className="text-xs">Back to Ticket Management</span>
      </button>

      {/* Header */}
      <div className="relative mb-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 animate-slideUp">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
              <List className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold dark:text-white">All Tickets</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                View and manage all tickets
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            {/* FILTER COMPONENT */}
            <TicketFilters
              filters={filters}
              setFilters={setFilters}
              employees={employees}
              tickets={tickets}
              role={role}
            />

            {/* TOTAL BOX */}
            <div className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <p className="text-[10px] text-gray-500 uppercase">Total</p>
              <p className="text-sm font-bold dark:text-white">
                {filteredTickets.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-x-auto animate-slideUp">
        <table className="min-w-full text-sm divide-y dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-xs text-left">Actions</th>
              {[
                { key: "id", label: "Ticket No" },
                { key: "title", label: "Title" },

                { key: "projectName", label: "Application" },
                { key: "companyName", label: "Company" },
                { key: "User", label: "User" },
                { key: "priority", label: "Priority" },
                { key: "status", label: "Status" },
                ...(role !== "employee"
                  ? [{ key: "assignedToEmp", label: "Assign To" }]
                  : []),
                { key: "docDate", label: "Created Date" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-2 py-2 text-xs text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1 justify-start">
                    {col.label}
                    {renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {paginatedTickets.map((ticket) => {
              const assignedEmployee = employees.find(
                (e) => e.email === ticket.assignedToEmp,
              );
              return (
                <tr
                  key={ticket.id}
                  onMouseEnter={() => setHoveredRow(ticket.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${hoveredRow === ticket.id ? "border-l-4 border-blue-500" : ""
                    } animate-slideUp`}
                >
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setIsPopupOpen(true);
                      }}
                      className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full"
                    >
                      <Eye size={16} className="text-blue-500" />
                    </button>
                  </td>

                  <td className="px-2 py-2 text-left">{ticket.id}</td>
                  <td className="px-2 py-2 text-left">{ticket.title}</td>

                  <td className="px-2 py-2 text-left">
                    {ticket.application || "-"}
                  </td>
                  <td className="px-2 py-2 text-left">
                    {ticket.customer || "-"}
                  </td>
                  <td className="px-2 py-2 text-left">{ticket.createdBy}</td>

                  <td className="px-2 py-2 text-left">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getPriorityStyle(
                        ticket.priority,
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>

                  <td className="px-2 py-2 text-left">
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        handleStatusChange(ticket.id, e.target.value)
                      }
                      disabled={role === "customer"}
                      className="border rounded px-2 py-1 text-sm dark:bg-gray-700"
                    >
                      <option value="Inprogress">Inprogress</option>
                      <option value="Completed">Completed</option>
                      <option value="YetToAssign">YetToAssign</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>

                  {role !== "employee" && (
                    <td className="px-2 py-2 text-left">
                      {role === "admin" ? (
                        <select
                          value={ticket.assignedToEmp || ""}
                          onChange={(e) =>
                            handleAssignChange(ticket.id, e.target.value)
                          }
                          disabled={assigning[ticket.id]}
                          className="border rounded px-2 py-1 text-sm dark:bg-gray-700"
                        >
                          <option value="">Unassigned</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.email}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        assignedEmployee?.name || "Unassigned"
                      )}
                    </td>
                  )}
                  <td className="px-2 py-2 text-left">
                    {formatDate(ticket.docDate)}
                  </td>
                 
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 animate-slideUp">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <TicketPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};

/* Animations */
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

export default AllTickets;
