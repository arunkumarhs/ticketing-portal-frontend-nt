import { FileText, BarChart3, TrendingUp } from "lucide-react";

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
      roles: ["admin", "employee", "customer"],
    },
  ],
};

export default ReportMenu;
