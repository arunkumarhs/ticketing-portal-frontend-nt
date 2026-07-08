// ===============================
// EMPLOYEE LINE CHART (LIKE IMAGE)
// ===============================

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { ticketAPI } from "../../api/ticketAPI";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const EmployeeLineChart = ({ theme = "dark" }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    completed: [],
    progress: [],
  });

  useEffect(() => {
    const loadChart = async () => {
      try {
        // USE YOUR API HERE
        // Example structure expected:
        // [
        //   { date: "May 9", completed: 3, inprogress: 2 }
        // ]

        const response = await ticketAPI.getWeeklyTicketOverview();

        setChartData({
          labels: response.map((i) => i.date),
          completed: response.map((i) => i.completed),
          progress: response.map((i) => i.inprogress),
        });
      } catch (e) {
        console.log(e);

        // DEMO DATA
        setChartData({
          labels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
          completed: [3, 6, 4, 4, 2, 2.5, 6],
          progress: [3, 3.3, 1.7, 3, 1.5, 1.5, 4],
        });
      }
    };

    loadChart();
  }, []);

  const isDark = theme === "dark";

  const textColor = isDark ? "#d1d5db" : "#111827";

  const data = {
    labels: chartData.labels,

    datasets: [
      {
        label: "Completed",
        data: chartData.completed,

        borderColor: "#10d399",
        backgroundColor: "rgba(16,211,153,0.15)",

        tension: 0.45,
        fill: true,

        pointRadius: 4,
        pointHoverRadius: 6,

        pointBackgroundColor: "#10d399",
        pointBorderWidth: 0,

        borderWidth: 2.5,
      },

      {
        label: "In Progress",
        data: chartData.progress,

        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.10)",

        tension: 0.45,
        fill: true,

        pointRadius: 4,
        pointHoverRadius: 6,

        pointBackgroundColor: "#3b82f6",
        pointBorderWidth: 0,

        borderWidth: 2.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      intersect: false,
      mode: "index",
    },

    plugins: {
      legend: {
        position: "top",
        align: "end",

        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "line",
          padding: 18,
        },
      },

      tooltip: {
        backgroundColor: "#0f172a",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,

        titleColor: "#fff",
        bodyColor: "#cbd5e1",

        padding: 12,

        displayColors: true,
      },
    },

    scales: {
      x: {
        ticks: {
          color: "#94a3b8",
        },

        grid: {
          display: false,
          drawBorder: false,
        },

        border: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          color: "#94a3b8",
          stepSize: 2,
        },

        grid: {
          color: "rgba(255,255,255,0.06)",
          drawBorder: false,
        },

        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div>
     

      {/* CHART */}
      <div className="h-[230px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default EmployeeLineChart; 