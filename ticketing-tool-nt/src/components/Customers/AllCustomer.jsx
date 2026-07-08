import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  List,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { customerAPI } from "../../api/customerAPI";
import { useNavigate } from "react-router-dom";

const AllCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    key: "createdon",
    direction: "desc",
  });

  const [hoveredRow, setHoveredRow] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await customerAPI.getAllCustomers();
        setCustomers(res);
      } catch (error) {
        console.error(error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  /** Sorting */
  const handleSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return customers;

    const sorted = [...customers].sort((a, b) => {
      const aValue =
        sortConfig.key === "createdon"
          ? a?.commonDate?.createdon
          : a?.[sortConfig.key];

      const bValue =
        sortConfig.key === "createdon"
          ? b?.commonDate?.createdon
          : b?.[sortConfig.key];

      const aDate = Date.parse(aValue);
      const bDate = Date.parse(bValue);

      if (!isNaN(aDate) && !isNaN(bDate)) return aDate - bDate;

      if (typeof aValue === "string")
        return (aValue || "").localeCompare(bValue || "");

      return (aValue || 0) - (bValue || 0);
    });

    return sortConfig.direction === "desc" ? sorted.reverse() : sorted;
  }, [customers, sortConfig]);

  /** Reset page on sort */
  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig]);

  /** Pagination */
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return sortedCustomers.slice(start, start + recordsPerPage);
  }, [sortedCustomers, currentPage]);

  const totalPages = Math.ceil(sortedCustomers.length / recordsPerPage);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;

    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  if (loading) {
    return (
      <p className="text-center mt-10 animate-fadeIn">
        Loading customers...
      </p>
    );
  }

  return (
    <div className="px-3 py-3 animate-fadeIn">

      {/* Back */}
      <button
        onClick={() => navigate("/menu/customer")}
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-3"
      >
        <ArrowLeft size={14} />
        <span className="text-xs">Back to Customer Management</span>
      </button>

      {/* Header */}
      <div className="relative mb-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 animate-slideUp">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
              <List className="h-4 w-4 text-white" />
            </div>

            <div>
              <h1 className="text-sm font-bold dark:text-white">
                All Customers
              </h1>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                View and manage all customers
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded-lg border">
            <p className="text-[9px] text-gray-500 uppercase">Total</p>
            <p className="text-xs font-bold dark:text-white">
              {customers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 animate-slideUp">
  <table className="w-full table-fixed">

    {/* HEADER */}
    <thead>
      <tr className="border-b border-gray-200/60 dark:border-white/10">

        {[
          { key: "userId", label: "ID", w: "80px" },
          { key: "firstName", label: "Name", w: "160px" },
          { key: "email", label: "Email", w: "220px" },
          { key: "company", label: "Company", w: "160px" },
          { key: "loginStatus", label: "Login", w: "100px" },
          { key: "active", label: "Active", w: "100px" },
          { key: "createdon", label: "Created On", w: "130px" },
        ].map((col) => (
          <th
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={`w-[${col.w}] px-2 py-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left cursor-pointer`}
          >
            <div className="flex items-center gap-1">
              {col.label}
              {renderSortIcon(col.key)}
            </div>
          </th>
        ))}

      </tr>
    </thead>

    {/* BODY */}
    <tbody>
      {paginatedCustomers.map((customer, index) => (
        <tr
          key={customer.userId}
          style={{ animationDelay: `${index * 40}ms` }}
          onMouseEnter={() => setHoveredRow(customer.userId)}
          onMouseLeave={() => setHoveredRow(null)}
          className={`
            border-b border-gray-100/60 dark:border-white/5
            hover:bg-gray-50 dark:hover:bg-white/[0.03]
            transition-all duration-200 animate-fadeIn
            ${hoveredRow === customer.userId ? "border-l-4 border-blue-500" : ""}
          `}
        >

          {/* ID */}
          <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300">
            {customer.userId}
          </td>

          {/* NAME */}
          <td className="px-2 py-3 text-xs text-gray-600 dark:text-white">
            <div className="truncate max-w-[140px]" title={customer.firstName}>
              {customer.firstName}
            </div>
          </td>

          {/* EMAIL */}
          <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="truncate max-w-[200px]" title={customer.email}>
              {customer.email}
            </div>
          </td>

          {/* COMPANY */}
          <td className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300 truncate">
            {customer.company || "-"}
          </td>

          {/* LOGIN STATUS */}
          <td className="px-2 py-3 text-xs">
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-medium ${
                customer.loginStatus
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {customer.loginStatus ? "Online" : "Offline"}
            </span>
          </td>

          {/* ACTIVE */}
          <td className="px-2 py-3 text-xs">
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-medium ${
                customer.active
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {customer.active ? "Active" : "Inactive"}
            </span>
          </td>

          {/* DATE */}
          <td className="px-2 py-3 text-xs  text-gray-600 dark:text-gray-300">
            {customer?.commonDate?.createdon
              ? new Date(customer.commonDate.createdon).toLocaleDateString()
              : "-"}
          </td>

        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Pagination */}
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
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
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

export default AllCustomer;