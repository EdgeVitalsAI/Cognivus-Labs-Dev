const MiniBarChart = ({ values, max = 100, unit = '' }) => (
  <div className="flex items-end gap-1 h-20">
    {values.map((v, i) => (
      <div key={i} className="flex-1 bg-gradient-to-t from-sky-500 to-sky-400/60 rounded-t-sm" style={{ height: `${(v / max) * 100}%` }} />
    ))}
  </div>
)

const VitalsTrends = () => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700">
      <h3 className="text-sm font-semibold">Critical Vitals Trends</h3>
    </div>
    <div className="p-5 space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>Avg Heart Rate</span>
          <span className="text-slate-200 font-semibold">74 bpm</span>
        </div>
        <MiniBarChart values={[20, 30, 25, 28, 35, 22, 40, 38, 42, 45, 30, 28, 25, 35, 48, 50, 46]} max={60} />
        <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>20:00</span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>Avg Blood Pressure</span>
          <span className="text-slate-200 font-semibold">122 mmHg</span>
        </div>
        <MiniBarChart values={[40, 38, 36, 34, 33, 32, 30, 31, 32, 33, 35, 36, 38, 40, 39, 37, 35]} max={60} />
        <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>20:00</span>
        </div>
      </div>
    </div>
  </div>
)

export default VitalsTrends
