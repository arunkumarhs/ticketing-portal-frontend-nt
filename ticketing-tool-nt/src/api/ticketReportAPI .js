import apiClient from "./apiClient";

export const ticketReportAPI = {
  // ---------------- getApplicationDetails ----------------
  getApplicationDetails: async () => {
    try {
      const response = await apiClient.get("/api/ticket/getApplicationDetails");

      if (response?.statusFlag === "Ok" || response?.status === true) {
        return response?.paramObjectsMap?.ticketPriorityStatusDetails || [];
      }

      throw new Error(
        JSON.stringify(response) || "Failed to fetch application details",
      );
    } catch (error) {
      console.error("Error fetching application details:", error);
      throw error;
    }
  },

  // ---------------- getTicketReports ----------------
  getTicketReports: async ({ application = "ALL", fromDate, toDate }) => {
    try {
      const response = await apiClient.get("/api/ticket/getTicketReports", {
        params: {
          application,
          fromDate,
          toDate,
        },
      });

      if (response?.statusFlag === "Ok" || response?.status === true) {
        return response?.paramObjectsMap?.ticketVO || [];
      }

      throw new Error(
        JSON.stringify(response) || "Failed to fetch ticket reports",
      );
    } catch (error) {
      console.error("Error fetching ticket reports:", error);
      throw error;
    }
  },
};
