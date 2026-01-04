import { Brain } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AIInsightCard from '../components/ai-insights/AIInsightCard';
import RiskAssessmentCard from '../components/ai-insights/RiskAssessmentCard';
import { authService } from '../services/api';

const AIInsightsPage = () => {
    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());

    const [insights] = useState([
        {
            id: 1,
            type: 'medication',
            title: 'Medication Interaction Risk Detected',
            patient: 'Wathsala Dewmina',
            patientId: 1,
            severity: 'HIGH',
            confidence: 94,
            description:
                'Aspirin + Lisinopril may increase potassium levels. Monitor K+ levels weekly.',
            recommendation: 'Schedule lab work for potassium level check within 48 hours',
            action: 'Schedule Lab Work',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            addressed: false,
        },
        {
            id: 2,
            type: 'prediction',
            title: 'Readmission Risk: 72% Probability',
            patient: 'Wooshan Gamage',
            patientId: 2,
            severity: 'HIGH',
            confidence: 87,
            description:
                'Patient shows 3 risk factors: Low adherence, high BP variability, missed follow-up',
            recommendation: 'Increase monitoring frequency, schedule follow-up within 7 days',
            action: 'Schedule Follow-up',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            addressed: false,
        },
        {
            id: 3,
            type: 'dosage',
            title: 'Dosage Optimization Recommended',
            patient: 'Rivindu Ashinsa',
            patientId: 3,
            severity: 'MEDIUM',
            confidence: 81,
            description:
                'Current Metoprolol dosage shows suboptimal effect. Increasing to 75mg may improve control.',
            recommendation: 'Consider increasing dosage from 50mg to 75mg, monitor HR response',
            action: 'Review & Adjust',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            addressed: false,
        },
        {
            id: 4,
            type: 'lifestyle',
            title: 'Lifestyle Modification Impact Analysis',
            patient: 'Robert Key',
            patientId: 4,
            severity: 'LOW',
            confidence: 76,
            description:
                'Patient BP shows 15% improvement after 2 weeks of exercise regimen compliance.',
            recommendation: 'Continue current exercise program, consider dietary adjustment',
            action: 'View Details',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            addressed: true,
        },
        {
            id: 5,
            type: 'lab',
            title: 'Lab Values Trend Alert',
            patient: 'Lakindu Minosha',
            patientId: 5,
            severity: 'MEDIUM',
            confidence: 89,
            description:
                'Creatinine levels trending up (0.8→1.1). May indicate early kidney dysfunction.',
            recommendation:
                'Order comprehensive metabolic panel, assess eGFR, monitor renal function',
            action: 'Order Tests',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            addressed: false,
        },
        {
            id: 6,
            type: 'pattern',
            title: 'Circadian Pattern Detected in Vitals',
            patient: 'Ben Southern',
            patientId: 6,
            severity: 'LOW',
            confidence: 72,
            description:
                'HR peaks at 2 AM, indicating possible sleep disturbance or nocturnal arrhythmia.',
            recommendation: 'Refer to sleep study, consider nocturnal monitoring',
            action: 'Refer Specialist',
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
            addressed: true,
        },
    ]);

    const [riskAssessments] = useState([
        {
            id: 1,
            patient: 'Wathsala Dewmina',
            patientId: 1,
            overallRisk: 85,
            riskFactors: [
                { name: 'Cardiovascular Risk', score: 92, trend: 'up' },
                { name: 'Medication Non-Adherence', score: 78, trend: 'stable' },
                { name: 'Comorbidity Load', score: 75, trend: 'up' },
                { name: 'Social Determinants', score: 65, trend: 'down' },
            ],
            predictedOutcomes: [
                { outcome: 'Hospital Readmission (30 days)', probability: 72 },
                { outcome: 'ED Visit (14 days)', probability: 58 },
                { outcome: 'Medication Adjustment Needed', probability: 81 },
            ],
        },
        {
            id: 2,
            patient: 'Emma Davis',
            patientId: 7,
            overallRisk: 35,
            riskFactors: [
                { name: 'Cardiovascular Risk', score: 28, trend: 'down' },
                { name: 'Medication Non-Adherence', score: 15, trend: 'down' },
                { name: 'Comorbidity Load', score: 22, trend: 'stable' },
                { name: 'Social Determinants', score: 18, trend: 'down' },
            ],
            predictedOutcomes: [
                { outcome: 'Hospital Readmission (30 days)', probability: 12 },
                { outcome: 'ED Visit (14 days)', probability: 8 },
                { outcome: 'Medication Adjustment Needed', probability: 25 },
            ],
        },
    ]);

    const handleMarkAddressed = (insightId) => {
        console.log('Mark insight addressed:', insightId);
    };

    const handleViewPatient = (patientId) => {
        navigate(`/doctor/patients/${patientId}`);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/doctor/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <TopBar userName={`Dr. ${user?.full_name || 'Loading...'}`} />

            <div className="flex">
                <Sidebar onLogout={handleLogout} />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="w-8 h-8 text-purple-500" />
                            <h1 className="text-3xl font-bold text-white">AI Insights</h1>
                        </div>
                        <p className="text-slate-400">
                            AI-powered clinical insights and risk assessments for patient care
                        </p>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Active Insights</p>
                            <p className="text-2xl font-bold text-white">
                                {insights.filter((i) => !i.addressed).length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">High Priority</p>
                            <p className="text-2xl font-bold text-red-400">
                                {insights.filter((i) => i.severity === 'HIGH').length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Risk Assessments</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {riskAssessments.length}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                            <p className="text-slate-400 text-sm">Addressed</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {insights.filter((i) => i.addressed).length}
                            </p>
                        </div>
                    </div>

                    {/* AI Insights Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Clinical Insights</h2>
                        <div className="space-y-4">
                            {insights.map((insight) => (
                                <AIInsightCard
                                    key={insight.id}
                                    insight={insight}
                                    onMarkAddressed={handleMarkAddressed}
                                    onViewPatient={handleViewPatient}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Risk Assessments Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Risk Assessments</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {riskAssessments.map((assessment) => (
                                <RiskAssessmentCard
                                    key={assessment.id}
                                    assessment={assessment}
                                    onViewPatient={handleViewPatient}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AIInsightsPage;
