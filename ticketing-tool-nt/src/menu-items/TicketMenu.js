import {
  PlusCircle,
  List,
  Tag,
} from "lucide-react";

const ticketMenu = {
  title: "Ticket Management",
  description: "Create and manage ticket details before submission",
  icon: 
  Tag,
  gradient: "bg-gradient-to-br from-blue-600 to-sky-500",

  items: [
    {
      name: "Create Ticket",
      path: "/newticket",
      icon: PlusCircle,
      color: "blue",
      roles: ["admin","customer"] // only admin can see
    },
    {
      name: "View Tickets",
      path: "/alltickets",
      icon: List,
      color: "blue",
      roles: ["admin", "employee","customer"] 
    }
  ]
};

export default ticketMenu;