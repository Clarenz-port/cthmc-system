// LoanStatusDonut.jsx
import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);



export default function LoanStatusDonut({ pending = 0, active = 0, duedate = 0 }) {
  const total = pending + active + duedate;
  const pct = v => (total === 0 ? "0%" : `${Math.round((v/total) * 100)}%`);

  const data = useMemo(() => ({
    labels: ["Pending","Active","Duedate"],
    datasets: [{
      data: [pending, active, duedate],
      backgroundColor: ["#F6AD55","#34D399","#F87171"],
      borderColor: "#ffffff",
      borderWidth: 2,
    }]
  }), [pending, active, duedate]);

  const options = {
    responsive: true,
    cutout: "66%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            const label = ctx.label || "";
            const val = Number(ctx.raw || 0);
            return `${label}: ${val.toLocaleString()} (${pct(val)})`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex gap-14 items-center">
      <div className="w-120 h-88 flex items-center justify-center">
        <Doughnut data={data} options={options}  />
      </div>

      <div className="flex-1">
        <h3 className="text-2xl font-bold text-gray-700 mb-3">Loan Status</h3>

        <div className="space-y-3">
          <LegendRow color="#F6AD55" label="Pending" value={pending} pct={pct(pending)} />
          <LegendRow color="#34D399" label="Active" value={active} pct={pct(active)} />
          <LegendRow color="#F87171" label="Duedate" value={duedate} pct={pct(duedate)} />
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, pct }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-base font-semibold text-gray-800">{value.toLocaleString()}</div>
        </div>
      </div>

    </div>
  );
}
