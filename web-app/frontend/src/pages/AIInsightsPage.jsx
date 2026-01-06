import { Brain } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
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
