import { clsx } from "clsx";
import {
  LayoutDashboard,
  Tag,
  IdCardLanyard,
  SquareUser,
  BarChart3,
} from "lucide-react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const user = useSelector((state) => state.auth.user);

  const role = user?.type?.trim().toLowerCase() || "";

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      bgColor:
        "bg-gradient-to-br from-indigo-600 to-cyan-500 dark:from-indigo-500 dark:to-cyan-400",
      roles: ["admin", "employee"],
    },
    {
      name: "Ticket",
      href: "/menu/ticket",
      icon: Tag,
      bgColor:
        "bg-gradient-to-br from-blue-600 to-sky-500 dark:from-blue-500 dark:to-sky-400",
      roles: ["admin", "employee", "customer"],
    },
    {
      name: "Employee",
      href: "/menu/employee",
      icon: IdCardLanyard,
      bgColor:
        "bg-gradient-to-br from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400",
      roles: ["admin"],
    },
    {
      name: "Customer",
      href: "/menu/customer",
      icon: SquareUser,
      bgColor:
        "bg-gradient-to-br from-violet-600 to-indigo-500 dark:from-violet-500 dark:to-indigo-400",
      roles: ["admin"],
    },
    {
      name: "Reports",
      href: "/menu/report",
      icon: BarChart3,
      bgColor:
        "bg-gradient-to-br from-teal-600 to-cyan-500 dark:from-teal-500 dark:to-cyan-400",
      roles: ["admin"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(role),
  );

  if (!user) return null;

  return (
    <aside
      id="sidebar"
      className={clsx(
        "bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col",

        // MOBILE overlay
        "absolute md:relative left-0 top-14 md:top-auto z-40",
        "h-[calc(100%-3.5rem)] md:h-full",

        sidebarOpen ? "w-[170px]" : "w-20",

        //MOBILE ANIMATION
        "transform md:transform-none",
        "transition-transform duration-300 ease-in-out md:transition-all md:duration-300",

        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",

        "flex-shrink-0",
      )}
    >
      <div className="mt-2 flex-1 px-1.5 space-y-0.5 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  "flex items-center border transition-all duration-200 group",
                  isActive
                    ? "border-blue-300 dark:border-blue-700 bg-gray-100/50 dark:bg-gray-800/50"
                    : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                  sidebarOpen
                    ? "px-2 py-1.5 rounded-md"
                    : "p-1 rounded-full justify-center",
                )
              }
            >
              {/* ICON (ALWAYS SAME BG — NEVER CHANGES) */}
              <div className={clsx("rounded-md p-1.5", item.bgColor)}>
                <Icon className="h-4 w-4 text-white" />
              </div>

              {/* LABEL */}
              {sidebarOpen && (
                <span className="ml-2.5 text-sm font-medium">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </div>

      {sidebarOpen && (
        <div className="px-2 py-1 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-500">
          Version 1.0
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
