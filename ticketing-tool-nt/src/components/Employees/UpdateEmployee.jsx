import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, X, Edit, Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../api/employeeAPI";
import { encryptPassword } from "../../utils/PasswordEnc";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const UpdateEmployee = () => {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [employeeCodes, setEmployeeCodes] = useState([]);
  const [formData, setFormData] = useState({
    employee: "",
    code: "",
    email: "",
    department: "",
    branch: "",
    designation: "",
    dob: null,
    doj: null,
    password: "",
    gender: "",
    active: true,
  });

  useEffect(() => {
    const loadEmployeeCodes = async () => {
      try {
        const employees = await employeeAPI.getAllEmployees();

        setEmployeeCodes(employees.map((emp) => emp.code).filter(Boolean));
      } catch (error) {
        console.error("Failed to load employee codes", error);
      }
    };

    loadEmployeeCodes();
  }, []);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleSearch = async () => {
    if (!code) {
      setErrorMessage("Enter employee code");
      return;
    }

    try {
      const employees = await employeeAPI.getAllEmployees();
      const emp = employees.find(
        (e) => e.code.toLowerCase() === code.toLowerCase(),
      );

      if (!emp) {
        setErrorMessage("Employee not found");
        return;
      }

      setEmployeeId(emp.id);

      setFormData({
        employee: emp.name || "",
        code: emp.code || "",
        email: emp.email || "",
        department: emp.department || "",
        branch: emp.branch || "",
        designation: emp.designation || "",
        dob: emp.dob ? new Date(emp.dob) : null,
        doj: emp.doj ? new Date(emp.doj) : null,
        password: "",
        gender: emp.gender || "",
        active: true,
      });

      setIsLoaded(true);
    } catch (err) {
      setErrorMessage("Failed to fetch employee");
    }
  };

  const handleClear = () => {
    setSuccessMessage("");
    setErrorMessage("");

    setFormData({
      employee: "",
      code: "",
      email: "",
      department: "",
      branch: "",
      designation: "",
      dob: null,
      doj: null,
      password: "",
      gender: "",
      active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId) {
      setErrorMessage("No employee selected");
      return;
    }

    try {
      const payload = {
        ...formData,
        id: employeeId,
        ...(formData.password && {
          password: encryptPassword(formData.password),
        }),
      };

      const res = await employeeAPI.updateEmployee(payload);

      if (res.success) {
        setSuccessMessage(
          `Employee "${formData.employee}" updated successfully!`,
        );

        setTimeout(() => {
          setSuccessMessage("");
          navigate("/allemployees");
        }, 2000);
      } else {
        setErrorMessage(res.error || "Update failed");
      }
    } catch (err) {
      setErrorMessage("Something went wrong");
    }
  };

  return (
    <div className="px-6 py-6 animate-fadeIn">
      {/* Success Popup */}
      {/* Center Toast (Success / Error) */}
      {(successMessage || errorMessage) &&
        (() => {
          const isSuccess = Boolean(successMessage);
          const message = successMessage || errorMessage;

          const handleClose = () => {
            setSuccessMessage("");
            setErrorMessage("");

            if (isSuccess) {
              navigate("/allemployees");
            }
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fadeIn">
              <div className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 text-center animate-slideUp border border-gray-200 dark:border-gray-700">
                {/* Icon */}
                <div className="flex justify-center mb-3">
                  <div
                    className={`p-2.5 rounded-full ${
                      isSuccess
                        ? "bg-green-50 dark:bg-green-500/10"
                        : "bg-red-50 dark:bg-red-500/10"
                    }`}
                  >
                    {isSuccess ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {isSuccess ? "Success" : "Error"}
                </h2>

                {/* Message */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {message}
                </p>

                {/* Button */}
                <button
                  onClick={handleClose}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                    isSuccess
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isSuccess ? "Go to Employees" : "Close"}
                </button>
              </div>
            </div>
          );
        })()}

      {/* Back Button */}
      <button
        onClick={() => navigate("/menu/employee")}
        className="group inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-all duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Back to Employee Management</span>
      </button>

      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-green-500/10 to-teal-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Update Employee
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Search and update employee details
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border hover:bg-gray-100"
            >
              <X size={16} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Code Input */}
      {!isLoaded && (
        <div className="flex animate-slideUp">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md border p-6 space-y-4">
            <h2 className="text-sm font-semibold">Enter Employee Code</h2>
            <input
              list="employeeCodes"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Select or Search Employee Code"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <datalist id="employeeCodes">
              {employeeCodes.map((empCode) => (
                <option key={empCode} value={empCode} />
              ))}
            </datalist>
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700"
            >
              <Search size={16} /> Fetch Employee
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {isLoaded && (
        <div className="flex animate-slideUp">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-md border p-6"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <Input
                label="Employee"
                name="employee"
                value={formData.employee}
                onChange={handleChange}
              />
              <Input
                label="Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
              />
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
              <Input
                label="Branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              />
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
              />

              {/* DatePickers */}
              <DatePickerInput
                label="DOB"
                selected={formData.dob}
                onChange={(date) => handleDateChange("dob", date)}
              />
              <DatePickerInput
                label="DOJ"
                selected={formData.doj}
                onChange={(date) => handleDateChange("doj", date)}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button className="w-full  mt-4 bg-green-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-green-700">
              <Save size={16} /> Update Employee
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

const DatePickerInput = ({ label, selected, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
      {label}
    </label>
    <DatePicker
      selected={selected}
      onChange={onChange}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
      dateFormat="dd/MM/yyyy"
      placeholderText="Select date"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  </div>
);

/* Animations */
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default UpdateEmployee;
