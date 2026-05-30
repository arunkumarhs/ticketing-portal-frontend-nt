import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  PlusCircle,
  List,
  FileExclamationPoint,
  LayoutDashboard,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Eye,
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
      title: "Total Tickets",
      value: totalTickets,
      subtitle: "All time tickets",
      icon: LayoutDashboard,
      color: "from-blue-600/20 to-blue-500/5 border-blue-500/20 text-blue-400",
    },
    {
      title: "Completed",
      value: completedTickets,
      subtitle: `${
        totalTickets ? ((completedTickets / totalTickets) * 100).toFixed(1) : 0
      }% completed`,
      icon: CheckCircle2,
      color:
        "from-emerald-600/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    },
    {
      title: "In Progress",
      value: inProgressTickets,
      subtitle: `${
        totalTickets ? ((inProgressTickets / totalTickets) * 100).toFixed(1) : 0
      }% active`,
      icon: Clock3,
      color:
        "from-indigo-600/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
    },
    {
      title: "Critical",
      value: criticalTickets,
      subtitle: "Need attention",
      icon: AlertTriangle,
      color: "from-red-600/20 to-rose-500/5 border-red-500/20 text-red-400",
    },
    {
      title: "Quick Access",
      isQuickAccess: true,
      color:
        "from-violet-600/20 to-indigo-500/5 border-violet-500/20 text-violet-400",
    },
  ];

  /* ================= MENU ================= */

  const menuItems = [
    {
      title: "Create Ticket",
      description: "Submit ticket",
      icon: PlusCircle,
      color: "from-indigo-600 to-purple-600",
      route: "/newticket",
      hideFor: ["employee"],
    },
    {
      title: "All Tickets",
      description: "View tickets",
      icon: List,
      color: "from-violet-600 to-indigo-600",
      route: "/alltickets",
    },
    {
      title: "Critical",
      description: "High priority",
      icon: FileExclamationPoint,
      color: "from-red-600 to-rose-600",
      route: "/criticaltickets",
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
        return "bg-red-500/20 text-red-400";

      case "high":
        return "bg-orange-500/20 text-orange-400";

      case "medium":
        return "bg-yellow-500/20 text-yellow-400";

      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400";

      case "inprogress":
        return "bg-indigo-500/20 text-indigo-400";

      case "rejected":
        return "bg-red-500/20 text-red-400";

      default:
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050816] text-gray-900 dark:text-white">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* ================= STATS ================= */}

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-2 mb-3">
          {stats.map((item, index) => {
            if (item.isQuickAccess) {
              return (
                <div
                  key={index}
                  className={`relative rounded-xl border bg-gradient-to-br ${item.color} 
          p-2.5 backdrop-blur-xl shadow-md h-[88px] flex flex-col justify-between
          ring-1 ring-black/5 dark:ring-white/10
          before:absolute before:inset-0 before:rounded-xl 
          before:bg-white/20 dark:before:bg-transparent`}
                >
                  <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white relative z-10">
                    Quick Access
                  </h2>

                  <div className="grid grid-cols-2 gap-2 relative z-10">
                    {filteredItems.slice(0, 2).map((a, i) => {
                      const Icon = a.icon;

                      return (
                        <button
                          key={i}
                          onClick={() => navigate(a.route)}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 
                  bg-white/60 dark:bg-white/5 
                  hover:bg-white/80 dark:hover:bg-white/10
                  backdrop-blur-md transition"
                        >
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center 
                    bg-gradient-to-r ${a.color}`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>

                          <p className="text-[10px] text-gray-900 dark:text-white">
                            {a.title}
                          </p>
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
                className={`relative rounded-xl border bg-gradient-to-br ${item.color} 
        px-3 py-2.5 shadow-md h-[88px] flex justify-between
        ring-1 ring-black/5 dark:ring-white/10
        before:absolute before:inset-0 before:rounded-xl 
        before:bg-white/15 dark:before:bg-transparent`}
              >
                <div className="relative z-10">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    {item.title}
                  </p>

                  <h2 className="text-[22px] font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </h2>

                  <p className="text-[9px] text-gray-600 dark:text-gray-400">
                    {item.subtitle}
                  </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center relative z-10">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= CHARTS ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-200 dark:border-white/10 p-4 shadow-xl h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Employee Ticket Overview
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
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

          <div className="rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-200 dark:border-white/10 p-4 shadow-xl h-[320px] flex flex-col">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Ticket Priority
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* RECENT TICKETS */}
          <div
            className="
      xl:col-span-2
      rounded-2xl border border-gray-200/70 dark:border-white/10
      bg-gradient-to-br from-white to-gray-50
      dark:from-[#0f172a]/90 dark:to-[#0b1220]/90
      backdrop-blur-xl
      p-3 shadow-sm
      animate-fadeIn
      transition-all duration-300
      hover:shadow-lg
    "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Recent Tickets
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Latest support activities
                </p>
              </div>

              <button
                onClick={() => navigate("/alltickets")}
                className="
          px-2.5 py-1.5 rounded-lg text-[11px]
          bg-white/80 dark:bg-white/5
          border border-gray-200/70 dark:border-white/10
          text-gray-700 dark:text-gray-300
          hover:bg-white dark:hover:bg-white/10
          hover:-translate-y-0.5 hover:shadow-md
          transition-all duration-200
        "
              >
                View All
              </button>
            </div>

            {/* TABLE */}
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
                hover:bg-gray-100/60 dark:hover:bg-white/[0.03]
                transition-all duration-200 ease-out
                animate-fadeIn
              "
                    >
                      {/* ID */}
                      <td className="py-3 text-xs text-gray-700 dark:text-gray-300 truncate">
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
                    px-2 py-1 rounded-md text-[10px] font-medium
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
                    px-2 py-1 rounded-md text-[10px] font-medium
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
                          {ticket.assignedToEmp || "Unassigned"}
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="py-3">
                        <button
                          onClick={() => navigate("/alltickets")}
                          className="
                    w-7 h-7 rounded-lg
                    bg-white/80 dark:bg-white/5
                    border border-gray-200/60 dark:border-white/10
                    flex items-center justify-center
                    hover:bg-white dark:hover:bg-white/10
                    hover:-translate-y-0.5 hover:shadow-md
                    transition-all duration-200
                  "
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOP ASSIGNEES */}
          <div
            className="
      rounded-2xl border border-gray-200/70 dark:border-white/10
      bg-gradient-to-br from-white to-gray-50
      dark:from-[#0f172a]/90 dark:to-[#0b1220]/90
      backdrop-blur-xl 
      p-3 shadow-sm
      animate-fadeIn
      transition-all duration-300
      hover:shadow-lg
    "
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Top Assignees
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Employee ticket handling
              </p>
            </div>

            <div className="space-y-4">
              {topEmployees.map((employee, index) => (
                <div
                  key={index}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="animate-fadeIn"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="
                  w-8 h-8 rounded-full
                  bg-gradient-to-br from-indigo-500 to-cyan-500
                  flex items-center justify-center
                  font-semibold text-[11px] text-white
                  shadow-sm
                "
                      >
                        {employee.name?.charAt(0)}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                          {employee.name}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {employee.tickets} tickets
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {employee.progress}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
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
          </div>
        </div>
      </div>

      {/* ================= ANIMATION ================= */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
