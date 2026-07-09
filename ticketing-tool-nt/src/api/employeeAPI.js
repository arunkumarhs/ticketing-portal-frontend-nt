import apiClient from "./apiClient";

// Reusable payload builder
const buildEmployeePayload = (data, isUpdate = false) => ({
  active: data.active ?? true,
  branch: data.branch,
  code: data.code,
  createdBy: data.createdBy || "admin",
  department: data.department,
  designation: data.designation,
  dob: data.dob,
  doj: data.doj,
  email: data.email,
  employee: data.employee,
  gender: data.gender,
  id: isUpdate ? data.id : 0,
  modifiedBy: "admin",
  ...(data.password && { password: data.password }),
});

export const employeeAPI = {
  // GET ALL EMPLOYEES
  getAllEmployees: async () => {
    try {
      const data = await apiClient.get("/api/employee/getAllEmployee");

      if (data?.statusFlag === "Ok") {
        return (
          data.paramObjectsMap?.employeeVO?.map((emp) => ({
            id: emp.id,
            name: emp.employee,
            employee: emp.employee,
            code: emp.code,
            branch: emp.branch,
            department: emp.department,
            designation: emp.designation,
            email: emp.email,
            dob: emp.dob,
            doj: emp.doj,
            gender: emp.gender,
            active: emp.active,
          })) || []
        );
      }

      throw new Error(JSON.stringify(data) || "Failed to fetch employees");
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  // GET EMPLOYEE BY CODE
  getEmployeeByCode: async (code) => {
    try {
      const data = await apiClient.get(
        `/api/employee/getEmployeeByCode/${code}`,
      );

      if (data?.statusFlag === "Ok") {
        const emp = data.paramObjectsMap?.employeeVO;

        return {
          id: emp.id,
          employee: emp.employee,
          code: emp.code,
          branch: emp.branch,
          department: emp.department,
          designation: emp.designation,
          email: emp.email,
          dob: emp.dob,
          doj: emp.doj,
          gender: emp.gender,
          active: emp.active,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching employee by code:", error);
      return null;
    }
  },

  // CREATE EMPLOYEE
createEmployee: async (employeeData) => {
  try {
    const payload = buildEmployeePayload(employeeData, false);

    console.log("CREATE PAYLOAD:", payload);

    let data;
    try {
      data = await apiClient.post("/api/employee/createemployee", payload);
    } catch (err) {
      console.warn("Retrying create with DTO wrapper...");

      data = await apiClient.post("/api/employee/createemployee", {
        createEmployeeDTO: payload,
      });
    }

    console.log("CREATE RESPONSE:", data);

    // Success
    if (data?.status === true || data?.statusFlag === "Ok") {
      return {
        success: true,
        ...data,
      };
    }

    // API returned an error response
    return {
      success: false,
      ...data,
      error:
        data?.paramObjectsMap?.errorMessage ||
        data?.paramObjectsMap?.message ||
        data?.message ||
        data?.errors ||
        "Failed to create employee",
    };
  } catch (error) {
    console.error("CREATE ERROR:", error?.response?.data || error.message);

    const errorData = error?.response?.data || {};

    return {
      success: false,
      ...errorData,
      error:
        errorData?.paramObjectsMap?.errorMessage ||
        errorData?.paramObjectsMap?.message ||
        errorData?.message ||
        error.message ||
        "Failed to create employee",
    };
  }
},

  // UPDATE EMPLOYEE
  updateEmployee: async (employeeData) => {
    try {
      if (!employeeData.id) {
        throw new Error("Employee ID is required for update");
      }

      const payload = buildEmployeePayload(employeeData, true);

      console.log("UPDATE PAYLOAD:", payload);

      let data;
      try {
        data = await apiClient.put("/api/employee/updateEmployee", payload);
      } catch (err) {
        console.warn("Retrying update with DTO wrapper...");

        data = await apiClient.put("/api/employee/updateEmployee", {
          createEmployeeDTO: payload,
        });
      }

      console.log("UPDATE RESPONSE:", data);

      if (data?.statusFlag === "Ok" || data?.status === true) {
        return { success: true, data };
      }

      return {
        success: false,
        error: data?.message || data?.errors || "Failed to update employee",
      };
    } catch (error) {
      console.error("UPDATE ERROR:", error?.response?.data || error.message);

      return {
        success: false,
        error:
          error?.response?.data?.message ||
          JSON.stringify(error?.response?.data) ||
          error.message,
      };
    }
  },
};
