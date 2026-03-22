import { Brain, Heart, Wind, AlertCircle, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AIInsightCard from '../components/ai-insights/AIInsightCard';
import RiskAssessmentCard from '../components/ai-insights/RiskAssessmentCard';
import { authService } from '../services/api';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const AIInsightsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const [insights, setInsights] = useState([]);
    const [monitoredPatients, setMonitoredPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
        fetchMonitoredPatients();
        const interval = setInterval(fetchMonitoredPatients, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_BASE_URL}/ai-insights`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { limit: 100 }
            });

            const transformed = response.data.insights.map(i => ({
                id: i.id,
                type: i.insight_type,
                title: i.title,
                patient: i.patient_name,
                patientId: i.patient_id,
                severity: i.severity,
                confidence: Math.round((i.confidence_score || 0.8) * 100),
                description: i.description,
                recommendation: i.recommendation || 'No recommendation provided',
                action: i.is_actionable ? 'View Details' : 'Acknowledged',
                timestamp: new Date(i.created_at),
                addressed: i.status !== 'PENDING_REVIEW',
            }));

            setInsights(transformed);
        } catch (err) {
            console.error('Failed to fetch AI insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonitoredPatients = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get(`${API_BASE_URL}/dashboard/patient-monitoring-summary`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setMonitoredPatients(res.data.patients || []);
        } catch (err) {
            console.error('Failed to fetch monitored patients:', err);
        }
    };

    const trendBadge = (trend) => {
        const configs = {
            normal: { label: 'Normal', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            stable: { label: 'Stable', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            abnormal: { label: 'Abnormal', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            declining: { label: 'Declining', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            unstable: { label: 'Unstable', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
            critical: { label: 'Critical', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
            insufficient_data: { label: 'No Data', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
        };
        const cfg = configs[trend] || configs.insufficient_data;
        return (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.cls}`}>
                {cfg.label}
            </span>
        );
    };

    const handleActionClick = (insightId) => {
        console.log('Action for insight:', insightId);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    const highSeverity = insights.filter((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL').length;
    const pending = insights.filter((i) => !i.addressed).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="w-8 h-8 text-blue-500" />
                            <h1 className="text-3xl font-bold text-white">AI Clinical Insights</h1>
                        </div>
                        <p className="text-slate-400">
                            AI-powered clinical decision support and risk assessments
                        </p>
                    </div>

                    {/* Active Patient Monitoring Section */}
                    {monitoredPatients.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-[#6E80E7]" />
                                <h2 className="text-xl font-semibold text-white">Active Patient Monitoring</h2>
                                <span className="text-xs text-slate-500 ml-2">
                                    {monitoredPatients.length} patient{monitoredPatients.length !== 1 ? 's' : ''} • Live AI Analysis
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {monitoredPatients.map((p) => {
                                    const ecgTrend = p.ecg?.trend || 'insufficient_data';
                                    const spo2Trend = p.spo2?.trend || 'insufficient_data';
                                    const isCritical = ecgTrend === 'unstable' || spo2Trend === 'critical';
                                    const isWarning = ecgTrend === 'abnormal' || spo2Trend === 'declining';

                                    return (
                                        <div
                                            key={p.patient_id}
                                            onClick={() => navigate(`/doctor/patients/${p.patient_id}`)}
                                            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/50 hover:scale-[1.02] ${
                                                isCritical ? 'border-red-500/50 shadow-lg shadow-red-500/5' :
                                                isWarning ? 'border-amber-500/30' : 'border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${
                                                        isCritical ? 'bg-red-500 animate-pulse' :
                                                        isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`} />
                                                    <span className="text-sm font-medium text-white truncate max-w-[120px]">{p.patient_name}</span>
                                                </div>
                                                <span className="text-xs text-slate-500">{p.room || ''}</span>
                                            </div>

                                            {/* ECG Status */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <Heart className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                                <span className="text-xs text-slate-400 w-8">ECG</span>
                                                {trendBadge(ecgTrend)}
                                                {p.ecg?.heart_rate && (
                                                    <span className="text-xs text-slate-300 ml-auto">{p.ecg.heart_rate} BPM</span>
                                                )}
                                            </div>

                                            {/* SpO2 Status */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <Wind className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                <span className="text-xs text-slate-400 w-8">SpO2</span>
                                                {trendBadge(spo2Trend)}
                                                {p.spo2?.current_value && (
                                                    <span className="text-xs text-slate-300 ml-auto">{p.spo2.current_value}%</span>
                                                )}
                                            </div>

                                            {/* Sensor warnings */}
                                            {(p.ecg?.leads_off || p.spo2?.finger_detected === false) && (
                                                <div className="mt-2 pt-2 border-t border-slate-800">
                                                    {p.ecg?.leads_off && (
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                                            <AlertCircle className="w-3 h-3" /> ECG leads disconnected
                                                        </div>
                                                    )}
                                                    {p.spo2?.finger_detected === false && (
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                                            <AlertCircle className="w-3 h-3" /> SpO2 sensor not worn
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Total Insights</p>
                            <p className="text-2xl font-bold text-white">{insights.length}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">High Priority</p>
                            <p className="text-2xl font-bold text-red-400">{highSeverity}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Pending Review</p>
                            <p className="text-2xl font-bold text-amber-400">{pending}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Addressed</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {insights.filter((i) => i.addressed).length}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                            <p className="ml-4 text-slate-400">Loading AI insights...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2">
                                    <h2 className="text-xl font-semibold text-white mb-4">Recent Insights</h2>
                                    <div className="space-y-4">
                                        {insights.length > 0 ? (
                                            insights.map((insight) => (
                                                <AIInsightCard
                                                    key={insight.id}
                                                    insight={insight}
                                                    onAction={handleActionClick}
                                                />
                                            ))
                                        ) : (
                                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
                                                <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                                <p className="text-slate-400 text-lg">No AI insights generated yet</p>
                                                <p className="text-slate-500 text-sm mt-2">
                                                    AI insights will appear here once patient data is analyzed
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-4">Risk Assessments</h2>
                                    <div className="space-y-4">
                                        {insights.filter(i => i.type === 'RISK_ASSESSMENT').length > 0 ? (
                                            insights
                                                .filter(i => i.type === 'RISK_ASSESSMENT')
                                                .slice(0, 5)
                                                .map((insight) => (
                                                    <RiskAssessmentCard key={insight.id} assessment={insight} />
                                                ))
                                        ) : (
                                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 text-center">
                                                <p className="text-slate-400 text-sm">No risk assessments available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AIInsightsPage;
