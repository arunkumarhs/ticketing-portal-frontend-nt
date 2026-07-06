import apiClient from "./apiClient";
import axios from "axios";

export const ticketAPI = {
  // Get all tickets
  getAllTickets: async () => {
    try {
      const data = await apiClient.get("/api/ticket/getAllTicket");

      if (data?.statusFlag === "Ok") {
        return data.paramObjectsMap?.ticketVO || [];
      }

      throw new Error(JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  },

  // Create ticket
  createTicket: async (payload) => {
    try {
      const response = await apiClient.post(
        "/api/ticket/createticket",
        payload,
      );

      if (response?.statusFlag === "Ok" || response?.status === true) {
        return response;
      }

      return null;
    } catch (error) {
      console.error("Error creating ticket:", error);
      return null;
    }
  },

  // Upload file (BYPASS apiClient to avoid JSON header issue)
  uploadTicketFile: async (ticketId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file); // must match backend key

      const response = await axios.post(
        `http://139.5.190.244:8061/api/ticket/upload?id=${ticketId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // browser sets boundary automatically
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error.response?.data || error);
      return null;
    }
  },

  // Assign a ticket to an employee
  assignTicket: async ({ id, assignedToEmployee, email, modifiedBy }) => {
    try {
      const payload = {
        id,
        assignedTo: assignedToEmployee,
        assignedToEmployee,
        email,
        modifiedBy,
      };

      const response = await apiClient.put("/api/ticket/assignTicket", payload);

      if (response?.status === true) {
        return {
          success: true,
          message: "Ticket assigned successfully",
          errors: response.errors || [],
        };
      }

      return {
        success: false,
        message: "Failed to assign ticket",
        errors: response.errors || [],
      };
    } catch (error) {
      console.error("Error assigning ticket:", error);
      return {
        success: false,
        message: error.message || "Unexpected error occurred",
        errors: [],
      };
    }
  },
  // Assign / Update Ticket Priority
  assignTicketPriority: async ({ ticketId, priority }) => {
    try {
      const response = await apiClient.put(
        "/api/ticket/assignedPriority",
        null,
        {
          params: {
            ticketId,
            priority,
          },
        },
      );

      if (response?.status === true && response?.statusFlag === "Ok") {
        return {
          success: true,
          ticket: response.paramObjectsMap?.ticketAssign,
          message:
            response.paramObjectsMap?.message ||
            "Ticket priority updated successfully",
        };
      }

      return {
        success: false,
        message: "Failed to update ticket priority",
        errors: response?.errors || [],
      };
    } catch (error) {
      console.error("Error updating ticket priority:", error);

      return {
        success: false,
        message: error.message || "Unexpected error occurred",
        errors: [],
      };
    }
  },

  // Get ticket priority status count
  getTicketPriorityStatusCount: async (assignedTo = "all") => {
    try {
      const data = await apiClient.get(
        "/api/ticket/getTicketPriorityStatusCount",
        {
          params: { assignedTo },
        },
      );

      if (data?.statusFlag === "Ok") {
        return (
          data.paramObjectsMap?.ticketPriorityStatusDetails?.[0] || {
            normal: 0,
            medium: 0,
            high: 0,
            total: 0,
            normalPer: 0,
            mediumPer: 0,
            highPer: 0,
          }
        );
      }

      throw new Error(
        JSON.stringify(data) || "Failed to fetch ticket priority status count",
      );
    } catch (error) {
      console.error("Error fetching ticket priority status count:", error);
      throw error;
    }
  },

  // Get employee ticket status counts
  getEmployeeTicketStatusCounts: async () => {
    try {
      const data = await apiClient.get(
        "/api/ticket/getEmployeeTicketStatusCounts",
      );

      if (data?.statusFlag === "Ok") {
        return data.paramObjectsMap?.ticketStatusDetails || [];
      }

      throw new Error(
        JSON.stringify(data) || "Failed to fetch employee ticket status counts",
      );
    } catch (error) {
      console.error("Error fetching employee ticket status counts:", error);
      throw error;
    }
  },

  // Get all tickets assigned to a specific employee
  getAllTicketsByAssignedTo: async ({ empCode, userType }) => {
    try {
      const data = await apiClient.get("/api/ticket/getAllTicketByAssignedTo", {
        params: { empCode, userType },
      });

      if (data?.statusFlag === "Ok" || data?.status === true) {
        return data.paramObjectsMap?.ticketVO || [];
      }

      throw new Error(JSON.stringify(data) || "Failed to fetch tickets");
    } catch (error) {
      console.error("Error fetching tickets by assigned employee:", error);
      throw error;
    }
  },

  // My Server Comments (uses sourceId)
  getMyServerComments: async (sourceId) => {
    try {
      const res = await apiClient.get("/api/ticket/getAllCommentsMyServer", {
        params: { ticketId: sourceId }, // 🔥 IMPORTANT
      });

      if (res?.statusFlag === "Ok") {
        return res.paramObjectsMap?.commentsVO || [];
      }

      return [];
    } catch (err) {
      console.error("Error fetching MY SERVER comments:", err);
      return [];
    }
  },

  // Customer Comments (uses actual ticketId)
  getCustomerComments: async (ticketId) => {
    try {
      const res = await apiClient.get(
        "/api/ticket/getAllCommentsAnotherServer",
        {
          params: { ticketId }, // normal ticketId
        },
      );

      if (res?.statusFlag === "Ok") {
        return res.paramObjectsMap?.commentsVO || [];
      }

      return [];
    } catch (err) {
      console.error("Error fetching CUSTOMER comments:", err);
      return [];
    }
  },
  // getTicketById
  getTicketById: async (id) => {
    try {
      const response = await apiClient.get(`/api/ticket/${id}`);

      if (response?.status === true && response?.statusFlag === "Ok") {
        return response.paramObjectsMap?.ticketVO || null;
      }

      console.warn("Ticket not found or invalid response", response);
      return null;
    } catch (error) {
      console.error("Error fetching ticket by ID:", id, error);
      return null;
    }
  },

  // Change ticket status
  changeTicketStatus: async ({ id, status, empCode }) => {
    try {
      const payload = {
        id,
        status,
        empCode, // MUST be email (based on your API response)
        createdon: new Date().toISOString(),
      };

      const response = await apiClient.put(
        "/api/ticket/ChangeTicketStatus",
        payload,
      );

      if (response?.status === true && response?.statusFlag === "Ok") {
        return {
          success: true,
          ticket: response.paramObjectsMap?.ticketAssign,
          message: response.paramObjectsMap?.message || "Status updated",
        };
      }

      return {
        success: false,
        message: "Failed to update status",
        errors: response?.errors || [],
      };
    } catch (error) {
      console.error("Error updating ticket status:", error);
      return {
        success: false,
        message: error.message || "Unexpected error",
        errors: [],
      };
    }
  },

  //createComment
  createComment: async ({ ticketId, sourceId, comment, commentName }) => {
    try {
      const finalTicketId = sourceId || ticketId; // 🔥 FORCE SOURCE ID

      const payload = {
        comment: String(comment || ""),
        commentName: String(commentName || ""),
        orgId: 1000000009,
        ticketId: Number(finalTicketId), // ✅ ALWAYS SOURCE ID
      };

      console.log("CREATE COMMENT PAYLOAD:", payload);

      const response = await apiClient.post(
        "/api/ticket/createComments",
        payload,
      );

      const commentVO = response?.paramObjectsMap?.commentVO;

      if (commentVO) {
        return {
          success: true,
          data: commentVO,
        };
      }

      return {
        success: false,
        message: "Failed to create comment",
      };
    } catch (error) {
      console.error("Error creating comment:", error);
      return {
        success: false,
        message: error.message || "Error creating comment",
      };
    }
  },
  // deleteComment
  deleteComment: async ({ id, sourceId }) => {
    try {
      const response = await apiClient.delete("/api/ticket/deleteComments", {
        params: {
          id: Number(id),
          sourceId: Number(sourceId),
        },
      });

      if (response?.status === true || response?.statusFlag === "Ok") {
        return {
          success: true,
          message:
            response?.paramObjectsMap?.message ||
            "Comment deleted successfully",
        };
      }

      return {
        success: false,
        message: "Failed to delete comment",
      };
    } catch (error) {
      console.error("Error deleting comment:", error.response?.data || error);

      return {
        success: false,
        message:
          error.response?.data?.paramObjectsMap?.message ||
          error.message ||
          "Error deleting comment",
      };
    }
  },

  // updateComment
  updateComment: async ({
    id,
    ticketId,
    commentName,
    comment,
    sourceId,
    sourceOrgId = 0,
    sourceTicketId = 0,
    sourceUserName = "",
  }) => {
    try {
      const payload = {
        id: Number(id),
        comment: String(comment || ""),
        commentName: String(commentName || ""),
        orgId: 1000000009, // ✅ REQUIRED
        ticketId: Number(ticketId),

        // ✅ REQUIRED BY BACKEND
        sourceId: Number(id),
        sourceOrgId,
        sourceTicketId,
        sourceUserName,
      };

      console.log("UPDATE COMMENT PAYLOAD:", payload);

      const response = await apiClient.put(
        "/api/ticket/updateComments",
        payload,
      );

      if (response?.id) {
        return {
          success: true,
          data: response,
        };
      }

      return {
        success: false,
        message: "Failed to update comment",
      };
    } catch (error) {
      console.error("Error updating comment:", error.response?.data || error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Error updating comment",
      };
    }
  },
};
