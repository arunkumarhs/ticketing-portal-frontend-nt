import React, { useState,useEffect } from "react";
import { Save, ArrowLeft, X, PlusCircle, Check } from "lucide-react";
import { ticketAPI } from "../../api/ticketAPI";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const NewTicket = () => {
  const [formData, setFormData] = useState({
    title: "",
    priority: "",
    description: "",
    file: null,
  });

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const user = useSelector((state) => state.auth.user);

  const username = user?.name || "User";
  const email = user?.email || "user@mail.com";
  const client = user?.type || "Client"; // only if your backend provides this



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  const handleClear = () => {
    setFormData({
      title: "",
      priority: "",
      description: "",
      file: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.priority || !formData.description) {
     setErrorMessage("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        client,
        createdBy: username,
        modifiedBy: username,
        email,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        application: "Ticketing Portal",
        customer: "WHY DIGIT PRIVATE LIMITED",
      };

      const createRes = await ticketAPI.createTicket(payload);

      if (!createRes) {
        setErrorMessage("Ticket creation failed");
        return;
      }

      const ticketId =
        createRes?.paramObjectsMap?.ticketVO?.id;

      if (!ticketId) {
        setErrorMessage("Ticket created but ID missing");
        return;
      }

      if (formData.file) {
        const uploadRes = await ticketAPI.uploadTicketFile(
          ticketId,
          formData.file
        );

        if (!uploadRes) {
         setErrorMessage("File upload failed");
          return;
        }
      }

      setSuccessMessage(`Ticket "${formData.title}" created successfully!`);
      handleClear();

     

    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-3 animate-fadeIn">

      {/* Success Toast */}
 {(successMessage || errorMessage) && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fadeIn">
    
    <div className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 text-center animate-slideUp border border-gray-200 dark:border-gray-700">
      
      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div
          className={`p-2.5 rounded-full ${
            successMessage
              ? "bg-green-50 dark:bg-green-500/10"
              : "bg-red-50 dark:bg-red-500/10"
          }`}
        >
          {successMessage ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {successMessage ? "Success" : "Error"}
      </h2>

      {/* Message */}
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        {successMessage || errorMessage}
      </p>

      {/* Button */}
      <button
        onClick={() => {
          setSuccessMessage("");
          setErrorMessage("");

          if (successMessage) {
            navigate("/menu/ticket");
          }
        }}
        className={`w-full py-2 rounded-lg text-sm font-medium transition ${
          successMessage
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {successMessage ? "Go to Tickets" : "Close"}
      </button>
    </div>
  </div>
)}



      <button
        onClick={() => navigate("/menu/ticket")}
        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-3 animate-slideUp"
      >
        <ArrowLeft size={14} />
        <span className="text-xs">Back to Ticket Management</span>
      </button>

      {/* Header */}
      <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3">

        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-green-500/10 to-teal-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">

          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <PlusCircle className="h-4 w-4 text-white" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                New Ticket
              </h1>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                Create a support ticket
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm bg-white dark:bg-gray-800 rounded-lg shadow-sm border hover:bg-gray-100"
            >
              <X size={14} /> Clear
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? "Submitting..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex  animate-slideUp">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 space-y-5"
        >
          <Input label="Title" name="title" value={formData.title} onChange={handleChange} />

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Priority</option>
              <option value="Normal">Normal</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Attachment
            </label>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs px-3 py-1.5 rounded-md border
      border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-700
      hover:bg-gray-100 dark:hover:bg-gray-600 transition">

                Choose File

                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {formData.file ? formData.file.name : "No file selected"}
              </span>
            </div>
          </div>

        </form>
      </div>
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

export default NewTicket;