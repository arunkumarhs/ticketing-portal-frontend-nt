import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, TrendingUp, ChevronRight } from "lucide-react";
import menuConfig from "../menu-items/index";

const MenuPage = () => {
  const navigate = useNavigate();
  const { menuName } = useParams();
  console.log(menuName);
  const user = useSelector((state) => state.auth.user);
  const role = user?.type?.toLowerCase();

  const config = menuConfig[menuName];

  if (!config) {
    navigate("/transporter");
    return null;
  }

  const Icon = config.icon;

  const filteredItems = config.items?.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(role);
  });

  const getIconColor = (name = "") => {
    const n = name.toLowerCase();

    // CREATE / ADD
    if (n.includes("create") || n.includes("add") || n.includes("new"))
      return "from-green-500 to-emerald-600";

    // UPDATE / EDIT
    if (n.includes("update") || n.includes("edit") || n.includes("modify"))
      return "from-yellow-500 to-orange-500";

    // DELETE / CRITICAL
    if (n.includes("delete") || n.includes("critical") || n.includes("error"))
      return "from-red-500 to-rose-600";

    // ANALYTICS / REPORT
    if (n.includes("analytics") || n.includes("report"))
      return "from-purple-500 to-indigo-600";

    // VIEW / LIST
    if (n.includes("view") || n.includes("list") || n.includes("all"))
      return "from-blue-500 to-cyan-600";

    return "from-gray-500 to-gray-700";
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-all duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Back to Dashboard</span>
        </button>

        {/* ================= HEADER ================= */}
        <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3">
          {/* blobs (reduced) */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 rounded-full blur-xl"></div>

          <div className="relative z-10 flex flex-col gap-2">
            {/* TITLE ROW */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* LEFT TITLE */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${config.gradient} shadow-sm`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {config.title}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* STATS */}
              {config.stats && (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase">
                      {config.stats.period}
                    </p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {config.stats.total}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px]">{config.stats.change}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= CARDS ================= */}
        <div className="flex flex-wrap gap-3 justify-start animate-slideUp">
          {filteredItems?.map((item, index) => {
            const ItemIcon = item.icon;
            const gradient = getIconColor(item.name);

            return (
              <div
                key={item.name}
                onClick={() => navigate(item.path)}
                className="group cursor-pointer w-[48%] sm:w-[180px] md:w-[220px]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="
                  bg-white dark:bg-gray-800
                  rounded-lg border border-gray-200 dark:border-gray-700
                  shadow-sm hover:shadow-md hover:scale-[1.02]
                  transition-all duration-300
                "
                >
                  <div className="p-3 flex flex-col gap-2">
                    {/* ICON (semantic color) */}
                    <div
                      className={`w-7 h-7 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* TEXT */}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </h3>

                    {/* CHEVRON */}
                    <div className="flex justify-end text-blue-600 dark:text-blue-400">
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= ANIMATIONS ================= */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default MenuPage;
