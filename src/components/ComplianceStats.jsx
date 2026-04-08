import { Users } from "lucide-react";

export function ComplianceStats({ allData }) {
    const {
      dnd_violations = '--',
      callback_sla_raised = '--',
      dial_method = '--',
      hooper_level = 0,
      callback_sla_missed = 0,
      risk_level = '--',
    
    } = allData || {};
    
    return (
      <div className="p-2 border border-border rounded-lg bg-card/60">
        <div className="m-2 lg:mb-4">
          <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Compliance 
          </h3>
        </div>
  
        <div className="grid grid-cols-3 gap-4">
          {/* Dialer Level */}
          <StatCard label="DND Violations" value={dnd_violations} />
          <StatCard label="Callback SLA:Missed" value={callback_sla_raised} />
          <StatCard label="Dial Method" value={dial_method} />
  
  
          {/* Calls Today */}
          <StatCard label="Hooper Level" value={hooper_level} />
  
          {/* Avg Agents */}
          <StatCard label="Callback SLA Missed" value={callback_sla_missed} />
          {/* Dial Method */}
          <StatCard label="risk_level" value={risk_level} />
  
          {/* Dialable Leads */}
          {/* <StatCard label="Dialable Leads" value={dialable_leads} /> */}
  
          {/* Trunk Fill */}
          {/* <StatCard
            label="Trunk Fill"
            value={`${trunk_short_fill.trunk_fill ?? 0}%`}
          /> */}
  
          {/* Trunk Short */}
          {/* <StatCard
            label="Trunk Short"
            value={trunk_short_fill.trunk_short ?? 0}
          /> */}
            {/* <StatCard
            label="order"
            value={order}
          /> */}
          {/* Performance */}
          {/* <div className="bg-slate-900/50 rounded p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Order
            </p>
            <p
              className={`text-sm font-semibold ${
                order === 'UP'
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {order}
            </p>
          </div> */}
        </div>
      </div>
    );
  }
  function StatCard({ label, value }) {
    return (
      <div className="border border-border rounded-md bg-card/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] p-4">
        <p className="text-lg mb-2">
          {label}
        </p>
        <p className="text-xl font-semibold text-emerald-400">
          {value}
        </p>
      </div>
    );
  }
  