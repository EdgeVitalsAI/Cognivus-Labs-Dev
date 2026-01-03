import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'

const RiskAssessmentCard = ({ assessment, onViewPatient }) => {
  const getRiskColor = (score) => {
    if (score >= 75) return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' }
    if (score >= 50) return { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-400' }
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-400' }
  }

  const overallRisk = getRiskColor(assessment.overallRisk)

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-emerald-400" />
      default:
        return <Minus className="w-4 h-4 text-slate-400" />
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-red-400'
      case 'down':
        return 'text-emerald-400'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <div className={`${overallRisk.bg} border ${overallRisk.border} rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <button
            onClick={() => onViewPatient(assessment.patientId)}
            className="text-xl font-bold text-white hover:text-sky-400 transition-colors flex items-center gap-2 mb-2"
          >
            {assessment.patient}
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-400">AI-Powered Risk Assessment</p>
        </div>
        <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${overallRisk.border} ${overallRisk.bg}`}>
          <p className={`text-2xl font-bold ${overallRisk.text}`}>{assessment.overallRisk}%</p>
          <p className="text-xs text-slate-400">Overall</p>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Risk Factors</h4>
        <div className="space-y-2">
          {assessment.riskFactors.map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-700">
              <div className="flex-1">
                <p className="text-sm text-slate-200">{factor.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${factor.score >= 75 ? 'bg-red-500' : factor.score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${factor.score}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-slate-200 w-8">{factor.score}</span>
                {getTrendIcon(factor.trend)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predicted Outcomes */}
      <div className="border-t border-slate-700 pt-6">
        <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Predicted Outcomes (30 days)</h4>
        <div className="space-y-2">
          {assessment.predictedOutcomes.map((outcome, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">{outcome.outcome}</p>
              <div className="flex items-center gap-3">
                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${outcome.probability >= 70 ? 'bg-red-500' : outcome.probability >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${outcome.probability}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-semibold w-12 text-right ${outcome.probability >= 70 ? 'text-red-400' : outcome.probability >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {outcome.probability}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RiskAssessmentCard
