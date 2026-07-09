import { FileText, BarChart3, TrendingUp, Timer } from "lucide-react";

const ReportMenu = {
  title: "Ticket Reports",
  description: "Analyze and view ticket performance reports",
  icon: FileText,
  gradient: "bg-gradient-to-br from-emerald-600 to-teal-500",

  items: [
    {
      name: "Summary Report",
      path: "/ticketreports",
      icon: BarChart3,
      color: "teal",
      roles: ["admin"],
    },
    {
      name: "SLA Report",
      path: "/sla/reports",
      icon: Timer,
      color: "teal",
      roles: ["admin"],
    },
  ],
};

export default ReportMenu;
