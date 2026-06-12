import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { AlertTriangle } from "lucide-react";
import { ticketAPI } from "../../api/ticketAPI";

ChartJS.register(ArcElement, Tooltip, Legend);

const TicketPriorityChart = () => {
  const [priorityData, setPriorityData] = useState({
    high: 0,
    medium: 0,
    normal: 0,
    total: 0,
    highPer: 0,
    mediumPer: 0,
    normalPer: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ticketAPI.getTicketPriorityStatusCount("all");

        setPriorityData({
          high: data?.high || 0,
          medium: data?.medium || 0,
          normal: data?.normal || 0,
          total: data?.total || 0,
          highPer: data?.highPer || 0,
          mediumPer: data?.mediumPer || 0,
          normalPer: data?.normalPer || 0,
        });
      } catch (error) {
        console.error("Error fetching ticket priority data:", error);
      }
    };

    loadData();
  }, []);

  const chartData = {
    labels: ["High", "Medium", "Normal"],
    datasets: [
      {
        data: [priorityData.high, priorityData.medium, priorityData.normal],
        backgroundColor: ["#ef4444", "#2563eb", "#10b981"],
        borderWidth: 0,
        cutout: "72%",
        spacing: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#fff",
        bodyColor: "#cbd5e1",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        callbacks: {
          label: (context) => {
            const label = context.label;
            const value = context.raw;

            let percentage = 0;

            if (label === "High") {
              percentage = priorityData.highPer;
            } else if (label === "Medium") {
              percentage = priorityData.mediumPer;
            } else {
              percentage = priorityData.normalPer;
            }

            return `${label}: ${value} (${Number(percentage).toFixed(2)}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      {/* MAIN CONTENT */}
      <div className="flex items-center gap-20">
        {/* CHART */}
        <div className="relative w-[220px] h-[180px]">
          <Doughnut data={chartData} options={options} />

          {/* CENTER VALUE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
              {priorityData.total}
            </h1>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total Tickets
            </p>
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex-1 space-y-3">
          {/* HIGH */}
          <div className="flex items-center justify-between min-h-[40px]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />

              <span className="text-sm text-gray-700 dark:text-gray-300">
                High ({priorityData.high}) -{" "}
                {Number(priorityData.highPer).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* MEDIUM */}
          <div className="flex items-center justify-between min-h-[40px]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />

              <span className="text-sm text-gray-700 dark:text-gray-300">
                Medium ({priorityData.medium}) -{" "}
                {Number(priorityData.mediumPer).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* NORMAL */}
          <div className="flex items-center justify-between min-h-[40px]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />

              <span className="text-sm text-gray-700 dark:text-gray-300">
                Low ({priorityData.normal}) -{" "}
                {Number(priorityData.normalPer).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT */}
      <div className="mt-5 flex justify-center items-center">
        <AlertTriangle size={15} className="text-red-500" />

        <p className="pl-2 text-xs text-red-500 font-medium">
          High priority tickets require immediate attention
        </p>
      </div>
    </div>
  );
};

export default TicketPriorityChart;
