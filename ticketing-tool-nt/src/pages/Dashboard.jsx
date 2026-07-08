import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import TicketPopup from "../components/Tickets/TicketPopup";
import {
  PlusCircle,
  List,
  LayoutDashboard,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sparkles,
  Inbox,
  Users,
} from "lucide-react";

import { ticketAPI } from "../api/ticketAPI";
import { employeeAPI } from "../api/employeeAPI";

import EmployeeBarChart from "../components/Charts/EmployeeBarChart";
import EmployeeDoughnutChart from "../components/Charts/EmployeeDoughnutChart";

const Dashboard = () => {
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const role = user?.type?.toLowerCase();

  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [allTickets, allEmployees] = await Promise.all([
          ticketAPI.getAllTickets(),
          employeeAPI.getAllEmployees(),
        ]);

        setEmployees(allEmployees || []);

        const normalizedTickets = (allTickets || []).map((t) => ({
          ...t,
          assignedToEmp: t.email || t.assignedToEmp || "",
          companyName: t.companyName || t.company || "",
        }));

        const visibleTickets =
          role === "admin"
            ? normalizedTickets
            : role === "employee"
              ? normalizedTickets.filter(
                  (t) =>
                    t.assignedToEmp === user?.email ||
                    t.assignedToEmp === user?.name,
                )
              : role === "customer"
                ? normalizedTickets.filter(
                    (t) =>
                      t.createdBy === user?.email || t.createdBy === user?.name,
                  )
                : [];

        setTickets(visibleTickets);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, role]);

  /* ================= STATS ================= */

  const totalTickets = tickets.length;

  const completedTickets = tickets.filter(
    (t) => t.status === "Completed",
  ).length;

  const inProgressTickets = tickets.filter(
    (t) => t.status === "Inprogress",
  ).length;

  const criticalTickets = tickets.filter(
    (t) => (t.priority || "").toLowerCase() === "critical",
  ).length;

  const stats = [
    {
      title: "Total",
      value: totalTickets,
      subtitle: "submitted tickets",
      icon: LayoutDashboard,
      accent: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-500/10 dark:bg-blue-400/10",
      ring: "hover:ring-blue-500/20",
    },
    {
      title: "Completed",
      value: completedTickets,
      subtitle: `${
        totalTickets ? ((completedTickets / totalTickets) * 100).toFixed(1) : 0
      }% completed`,
      icon: CheckCircle2,
      accent: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
      ring: "hover:ring-emerald-500/20",
    },
    {
      title: "In Progress",
      value: inProgressTickets,
      subtitle: `${
        totalTickets ? ((inProgressTickets / totalTickets) * 100).toFixed(1) : 0
      }% active`,
      icon: Clock3,
      accent: "text-indigo-500 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-400/10",
      ring: "hover:ring-indigo-500/20",
    },
    {
      title: "Critical",
      value: criticalTickets,
      subtitle: "Need attention",
      icon: AlertTriangle,
      accent: "text-red-500 dark:text-red-400",
      iconBg: "bg-red-500/10 dark:bg-red-400/10",
      ring: "hover:ring-red-500/20",
    },
    {
      title: "Quick Access",
      isQuickAccess: true,
    },
  ];

  /* ================= MENU ================= */

  const menuItems = [
    {
      title: "Create Ticket",
      description: "Submit ticket",
      icon: PlusCircle,
      color: "from-blue-500 to-blue-700",
      route: "/newticket",
      hideFor: ["employee"],
    },
    {
      title: "View Tickets",
      description: "View tickets",
      icon: List,
      color: "from-sky-500 to-blue-700",
      route: "/alltickets",
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.hideFor?.includes(role),
  );

  /* ================= RECENT TICKETS ================= */

  const recentTickets = useMemo(() => {
    return [...tickets].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
  }, [tickets]);

  /* ================= TOP EMPLOYEES ================= */

  const topEmployees = useMemo(() => {
    const employeeMap = {};

    tickets.forEach((ticket) => {
      // skip unassigned tickets
      if (!ticket.assignedToEmp) return;

      // find employee details
      const matchedEmployee = employees.find(
        (emp) => emp.email === ticket.assignedToEmp,
      );

      const employeeName = matchedEmployee?.name || ticket.assignedToEmp;

      if (!employeeMap[employeeName]) {
        employeeMap[employeeName] = {
          name: employeeName,
          tickets: 0,
        };
      }

      employeeMap[employeeName].tickets += 1;
    });

    // convert to array
    const sortedEmployees = Object.values(employeeMap)
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5); // TOP 5 ONLY

    return sortedEmployees.map((emp) => ({
      ...emp,
      progress: `${
        totalTickets ? Math.round((emp.tickets / totalTickets) * 100) : 0
      }%`,
    }));
  }, [tickets, employees, totalTickets]);

  const getPriorityStyle = (priority) => {
    switch ((priority || "").toLowerCase()) {
      case "critical":
        return "bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-inset ring-red-500/20";

      case "high":
        return "bg-orange-500/15 text-orange-500 dark:text-orange-400 ring-1 ring-inset ring-orange-500/20";

      case "medium":
        return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 ring-1 ring-inset ring-yellow-500/20";

      default:
        return "bg-blue-500/15 text-blue-500 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20";
    }
  };

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":
        return "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20";

      case "inprogress":
        return "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20";

      case "rejected":
        return "bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-inset ring-red-500/20";

      default:
        return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 ring-1 ring-inset ring-yellow-500/20";
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050816] text-gray-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-white/20 border-t-blue-500 animate-spin" />
          <span className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
            Loading dashboard…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-[1600px] mx-auto px-3">
        {/* ================= STATS ================= */}

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
          {stats.map((item, index) => {
            if (item.isQuickAccess) {
              return (
                <div
                  key={index}
                  className="relative rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-indigo-500/5 p-2 h-[60px] flex items-center shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                >
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {filteredItems.slice(0, 2).map((a, i) => {
                      const Icon = a.icon;

                      return (
                        <button
                          key={i}
                          onClick={() => navigate(a.route)}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                        >
                          <div
                            className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br ${a.color} shadow-sm`}
                          >
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>

                          <span className="text-[10px] font-medium text-gray-900 dark:text-white truncate">
                            {a.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const Icon = item.icon;

            return (
              <div
                key={index}
                className={`group relative rounded-xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-[#0f172a]/80 px-3 py-2.5 h-[60px] flex items-center gap-3 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.02] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${item.ring}`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${item.iconBg}`}
                >
                  <Icon className={`w-4 h-4 ${item.accent}`} strokeWidth={2} />
                </div>

                <div className="leading-tight min-w-0">
                  <p className="text-[15px] font-bold text-gray-900 dark:text-white tabular-nums">
                    {item.value}
                  </p>
                  <p className="text-[10.5px] font-medium text-gray-500 dark:text-gray-400 truncate">
                    {item.title} · {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= CHARTS ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          {/* First Card - Takes 2/3 width */}
          <div className="xl:col-span-2 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-200/70 dark:border-white/10 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  Weekly ticket performance
                </p>
              </div>
            </div>

            <div className="flex-1">
              <EmployeeBarChart
                theme={isDarkMode ? "dark" : "light"}
                tickets={tickets}
                employees={employees}
              />
            </div>
          </div>

          {/* Second Card - Takes 1/3 width */}
          <div className="xl:col-span-1 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-200/70 dark:border-white/10 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 h-[300px] flex flex-col">
            <div className="mb-3">
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                Distribution overview
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <EmployeeDoughnutChart
                theme={isDarkMode ? "dark" : "light"}
                tickets={tickets}
              />
            </div>
          </div>
        </div>

        {/* ================= BOTTOM SECTION ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* RECENT TICKETS */}
          <div
            className="
      xl:col-span-2
      rounded-2xl border border-gray-200/70 dark:border-white/10
      bg-white dark:bg-[#0f172a]/80
      p-4 shadow-sm
      transition-shadow duration-300
      hover:shadow-md
    "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Recent Tickets
                </h2>
              </div>

              <button
                onClick={() => navigate("/alltickets")}
                className="
          px-2.5 py-1.5 rounded-lg text-[11px] font-medium
          bg-gray-50 dark:bg-white/5
          border border-gray-200/70 dark:border-white/10
          text-gray-700 dark:text-gray-300
          hover:bg-white dark:hover:bg-white/10
          hover:-translate-y-0.5 hover:shadow-md
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
        "
              >
                View All
              </button>
            </div>

            {/* TABLE / EMPTY STATE */}
            {recentTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Inbox className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  No tickets yet
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  New tickets will show up here as soon as they're created.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200/60 dark:border-white/10">
                      <th className="w-[90px] pb-3 text-[11px] text-left font-medium text-gray-500 dark:text-gray-400">
                        Ticket ID
                      </th>
                      <th className="w-[240px] pb-3 text-[11px] text-left font-medium text-gray-500 dark:text-gray-400">
                        Subject
                      </th>
                      <th className="w-[100px] pb-3 text-[11px] text-left font-medium text-gray-500 dark:text-gray-400">
                        Priority
                      </th>
                      <th className="w-[120px] pb-3 text-[11px] text-left font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="w-[160px] pb-3 text-[11px] text-left font-medium text-gray-500 dark:text-gray-400">
                        Handled By
                      </th>
                      <th className="w-[70px] pb-3 text-[11px] text-left font-medium text-gray-500 dark:text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentTickets.map((ticket, index) => (
                      <tr
                        key={index}
                        style={{ animationDelay: `${index * 60}ms` }}
                        className="
                border-b border-gray-100/70 dark:border-white/5
                last:border-b-0
                hover:bg-gray-50 dark:hover:bg-white/[0.03]
                transition-colors duration-200 ease-out
                animate-fadeIn
              "
                      >
                        {/* ID */}
                        <td className="py-3 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {ticket.id}
                        </td>

                        {/* SUBJECT */}
                        <td className="py-3 text-xs text-gray-900 dark:text-white">
                          <div
                            className="max-w-[220px] truncate"
                            title={ticket.title}
                          >
                            {ticket.title}
                          </div>
                        </td>

                        {/* PRIORITY */}
                        <td className="py-3">
                          <span
                            className={`
                    inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium
                    ${getPriorityStyle(ticket.priority)}
                    hover:scale-105 transition-transform
                  `}
                          >
                            {ticket.priority}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-3">
                          <span
                            className={`
                    inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium
                    ${getStatusStyle(ticket.status)}
                    hover:scale-105 transition-transform
                  `}
                          >
                            {ticket.status}
                          </span>
                        </td>

                        {/* ASSIGNED */}
                        <td className="py-3 text-xs text-gray-600 dark:text-gray-300">
                          <div className="truncate max-w-[150px]">
                            {ticket.assignedToEmp || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="py-3">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsPopupOpen(true);
                            }}
                            className="
    w-7 h-7 rounded-lg
    bg-gray-50 dark:bg-white/5
    border border-gray-200/60 dark:border-white/10
    flex items-center justify-center
    hover:bg-white dark:hover:bg-white/10
    hover:-translate-y-0.5 hover:shadow-md
    transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
  "
                            aria-label={`View ticket ${ticket.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TOP ASSIGNEES */}
          <div
            className="
      rounded-2xl border border-gray-200/70 dark:border-white/10
      bg-white dark:bg-[#0f172a]/80
      p-4 shadow-sm
      transition-shadow duration-300
      hover:shadow-md
    "
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Top Assignees
              </h2>
            </div>

            {topEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  No assignees yet
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Assign tickets to see performance here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topEmployees.map((employee, index) => (
                  <div
                    key={index}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="animate-fadeIn"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="
                  relative w-8 h-8 shrink-0 rounded-full
                  bg-gradient-to-br from-indigo-500 to-cyan-500
                  flex items-center justify-center
                  font-semibold text-[11px] text-white
                  shadow-sm
                "
                        >
                          {employee.name?.charAt(0)}
                          {index === 0 && (
                            <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {employee.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {employee.tickets} tickets
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                        {employee.progress}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="
                h-full rounded-full
                bg-gradient-to-r from-blue-500 to-cyan-400
                transition-all duration-500
              "
                        style={{ width: employee.progress }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= ANIMATION ================= */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn {
            animation: none;
          }
        }
      `}</style>

      <TicketPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default Dashboard;
