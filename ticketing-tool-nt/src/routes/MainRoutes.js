// src/routes/MainRoutes.js
import { lazy } from "react";
import MainLayout from "../components/Layout/Layout";
import Loadable from "../components/UI/Loadable";
import ProtectedRoute from "./ProtectedRoutes";

import MenuPage from "../menu-items/MenuPage";
import AllTickets from "../components/Tickets/AllTickets";
import NewTicket from "../components/Tickets/NewTicket";
import NewEmployee from "../components/Employees/NewEmployee";
import AllEmployees from "../components/Employees/AllEmployees";
import UpdateEmployee from "../components/Employees/UpdateEmployee";
import AllCustomer from "../components/Customers/AllCustomer";
import UpdateCustomer from "../components/Customers/UpdateCustomer";
import ProfileSettings from "../components/settings/Profile";
import NewCustomer from "../components/Customers/NewCustomer";
import GetTicketReports from "../components/Report/GetTicketReports";
import SLAReport from "../components/Report/SLAReport";

const Dashboard = Loadable(lazy(() => import("../pages/Dashboard")));

const MainRoutes = {
  path: "/",
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: "",
      element: (
        <ProtectedRoute allowedRoles={["admin", "employee"]}>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "dashboard",
      element: (
        <ProtectedRoute allowedRoles={["admin", "employee"]}>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "menu/:menuName",
      element: (
        <ProtectedRoute
          allowedRoles={["admin", "employee", "customer"]}
          menuAccess={{
            admin: ["ticket", "employee", "customer", "settings", "report"],
            employee: ["ticket"],
            customer: ["ticket"], // only this allowed
          }}
        >
          <MenuPage />
        </ProtectedRoute>
      ),
    },

    // ---------- TICKETS ----------
    {
      path: "/alltickets",
      element: (
        <ProtectedRoute allowedRoles={["admin", "employee", "customer"]}>
          <AllTickets />
        </ProtectedRoute>
      ),
    },
    {
      path: "/newticket",
      element: (
        <ProtectedRoute allowedRoles={["admin", "customer"]}>
          <NewTicket />
        </ProtectedRoute>
      ),
    },

    // ---------- EMPLOYEE (ADMIN ONLY) ----------
    {
      path: "/newemployee",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <NewEmployee />
        </ProtectedRoute>
      ),
    },
    {
      path: "/Allemployees",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <AllEmployees />
        </ProtectedRoute>
      ),
    },
    {
      path: "/editemployee",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <UpdateEmployee />
        </ProtectedRoute>
      ),
    },

    // ---------- CUSTOMER (ADMIN ONLY) ----------

    {
      path: "/Newcustomer",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <NewCustomer />
        </ProtectedRoute>
      ),
    },
    {
      path: "/allCustomers",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <AllCustomer />
        </ProtectedRoute>
      ),
    },
    {
      path: "/editCustomer",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <UpdateCustomer />
        </ProtectedRoute>
      ),
    },

    // ---------- PROFILE (ALL USERS) ----------
    {
      path: "/myprofile",
      element: (
        <ProtectedRoute allowedRoles={["admin", "employee", "customer"]}>
          <ProfileSettings />
        </ProtectedRoute>
      ),
    },

    {
      path: "/ticketreports",
      element: (
        <ProtectedRoute allowedRoles={["admin", "employee", "customer"]}>
          <GetTicketReports />
        </ProtectedRoute>
      ),
    },
    {
      path: "/sla/reports",
      element: (
        <ProtectedRoute allowedRoles={["admin", "employee", "customer"]}>
          <SLAReport />
        </ProtectedRoute>
      ),
    },
  ],
};

export default MainRoutes;
