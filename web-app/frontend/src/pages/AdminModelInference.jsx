import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import ModelSelector from "../components/model-inference/ModelSelector";
import InferenceForm from "../components/model-inference/InferenceForm";
import InferenceResult from "../components/model-inference/InferenceResult";
import InferenceHistory from "../components/model-inference/InferenceHistory";
import ModelHealth from "../components/model-inference/ModelHealth";
import ModelVersion from "../components/model-inference/ModelVersion";
import PredictionChart from "../components/model-inference/PredictionChart";
import ModelMonitoring from "../components/model-inference/ModelMonitoring";
import {
  Shield, Terminal, Settings, LogOut, RefreshCw, Brain,
  BarChart3, Cpu, TrendingUp, AlertTriangle, ArrowLeft
} from "lucide-react";

const API_BASE_URL = "http://localhost:8001";

export default function AdminModelInference() {
  const navigate = useNavigate();
  const { currentTheme, theme } = useTheme();
  const [selectedModel, setSelectedModel] = useState("");
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState([]);
  const [versions, setVersions] = useState([]);
  const [stats, setStats] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyFilter, setHistoryFilter] = useState(null);
  const [monitoringData, setMonitoringData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const historyLimit = 20;

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/sys/auth");
      return;
    }
    fetchData();
  }, [navigate]);

  // Fetch history when filter or offset changes
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) fetchHistory();
  }, [historyOffset, historyFilter]);

  const getAuthConfig = () => {
    const token = localStorage.getItem("admin_token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchHistory = async () => {
    try {
      const config = getAuthConfig();
      let url = `${API_BASE_URL}/api/admin/inference-history?limit=${historyLimit}&offset=${historyOffset}`;
      if (historyFilter) url += `&severity=${historyFilter}`;

      const res = await axios.get(url, config);
      setHistoryData(res.data.history || []);
      setHistoryTotal(res.data.total || 0);
    } catch (err) {
      console.error("History fetch error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/sys/auth");
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = getAuthConfig();

      const [healthRes, versionsRes, statsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/model-health`, config),
        axios.get(`${API_BASE_URL}/api/admin/model-versions`, config),
        axios.get(`${API_BASE_URL}/api/admin/prediction-stats?days=7`, config),
        axios.get(`${API_BASE_URL}/api/admin/inference-history?limit=${historyLimit}&offset=0`, config),
      ]);

      const healthData = healthRes.data.data || [];
      setHealth(
        healthData.map((h) => ({
          name: h.model_name,
          status: h.status,
          latency: h.avg_response_time_ms || h.avg_confidence * 100,
          confidence: h.avg_confidence,
          totalInferences: h.total_inferences,
          errorRate: h.error_rate,
          precision: h.precision,
          recall: h.recall,
          f1Score: h.f1_score,
          dataDrift: h.data_drift,
          avgResponseTime: h.avg_response_time_ms,
        }))
      );

      const versionsData = versionsRes.data.data || [];
      setVersions(
        versionsData.map((v) => ({
          name: v.model_name,
          version: v.current_version,
          accuracy: v.avg_accuracy,
          totalPredictions: v.total_predictions,
        }))
      );

      const statsData = statsRes.data.data || [];
      setStats(
        statsData.map((s) => ({
          date: s.date,
          predictions: s.predictions,
          confidence: Math.round(s.avg_confidence * 100),
          model: s.model,
        }))
      );

      setHistoryData(historyRes.data.history || []);
      setHistoryTotal(historyRes.data.total || 0);

      // Fetch monitoring & logs separately so they don't break existing data
      try {
        const [monitoringRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/model-monitoring`, config),
          axios.get(`${API_BASE_URL}/api/admin/model-logs`, config),
        ]);
        setMonitoringData(monitoringRes.data.data || []);
        setLogsData(logsRes.data.data || []);
      } catch (monitorErr) {
        console.warn("Monitoring/logs fetch failed (non-critical):", monitorErr);
      }
    } catch (err) {
      console.error("Data fetch error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/sys/auth");
      } else {
        setError(err.response?.data?.detail || "Failed to load model data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInference = async (input) => {
    try {
      setError(null);
      const config = getAuthConfig();
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/model-inference`,
        { model_name: selectedModel, input },
        config
      );
      const inferenceResult = res.data.data;
      setResult(inferenceResult);
      // Refresh history after running inference
      fetchHistory();
    } catch (err) {
      console.error("Inference error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/sys/auth");
      } else {
        setError(err.response?.data?.detail || "Inference failed");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    navigate("/sys/auth");
  };

  // KPI computations
  const totalPredictions = health.reduce((sum, h) => sum + (h.totalInferences || 0), 0);
  const activeModels = health.length;
  const avgConfidence = health.length > 0
    ? Math.round((health.reduce((sum, h) => sum + (h.confidence || 0), 0) / health.length) * 100)
    : 0;
  const criticalAlerts = historyData.filter((h) => h.severity === "CRITICAL").length;

  // Nav button helper
  const NavButton = ({ label, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "4px",
        color: currentTheme.textSecondary,
        fontSize: "14px",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = currentTheme.hoverBackground;
        e.currentTarget.style.color = currentTheme.textPrimary;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = currentTheme.textSecondary;
      }}
    >
      {Icon && <Icon style={{ width: "14px", height: "14px" }} />}
      {label}
    </button>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: currentTheme.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: `4px solid ${currentTheme.border}`,
            borderTop: "4px solid #0066cc",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{
            color: currentTheme.textSecondary,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}>Loading model data...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: currentTheme.background,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* ── Header ── */}
      <div style={{
        backgroundColor: currentTheme.surface,
        borderBottom: `1px solid ${currentTheme.border}`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: theme === "dark" ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                backgroundColor: currentTheme.primary,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Shield style={{ width: "20px", height: "20px", color: "#ffffff" }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: currentTheme.textPrimary,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <Terminal style={{ width: "16px", height: "16px", color: currentTheme.primary }} />
                  Administrator Control Panel
                </h1>
                <p style={{
                  fontSize: "11px",
                  color: currentTheme.textTertiary,
                  margin: 0,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                }}>AI Model Inference</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <NavButton label="Dashboard" onClick={() => navigate("/sys/dashboard")} />
              <NavButton label="Devices" onClick={() => navigate("/sys/devices")} />
              <NavButton label="Users" onClick={() => navigate("/sys/users")} />
              <button
                onClick={() => navigate("/admin/model-inference")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: theme === "dark" ? "rgba(59,130,246,0.12)" : "rgba(0,102,204,0.08)",
                  border: "none",
                  borderRadius: "4px",
                  color: currentTheme.primary,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                AI Models
              </button>
              <button
                onClick={() => navigate("/sys/settings")}
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "4px",
                  color: currentTheme.textSecondary,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.hoverBackground;
                  e.currentTarget.style.color = currentTheme.textPrimary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = currentTheme.textSecondary;
                }}
              >
                <Settings style={{ width: "20px", height: "20px" }} />
              </button>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: currentTheme.surface,
                  border: "1px solid #dc2626",
                  borderRadius: "4px",
                  color: "#dc2626",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.surface;
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                <LogOut style={{ width: "16px", height: "16px" }} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ padding: "24px" }}>
        {/* Back Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={() => navigate("/sys/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: currentTheme.cardBackground,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: "4px",
              color: currentTheme.textPrimary,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.hoverBackground;
              e.currentTarget.style.borderColor = currentTheme.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.cardBackground;
              e.currentTarget.style.borderColor = currentTheme.border;
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Dashboard
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: "14px 18px",
            marginBottom: "20px",
            backgroundColor: theme === "dark" ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${theme === "dark" ? "#ef4444" : "#fecaca"}`,
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <AlertTriangle style={{ width: "18px", height: "18px", flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── KPI Summary Cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Total Predictions", value: totalPredictions.toLocaleString(), icon: BarChart3, color: currentTheme.primary, subtext: "Across all models" },
            { label: "Active Models", value: activeModels, icon: Cpu, color: "#22c55e", subtext: "Currently deployed" },
            { label: "Avg Confidence", value: `${avgConfidence}%`, icon: TrendingUp, color: "#a855f7", subtext: "Model average" },
            { label: "Critical Alerts", value: criticalAlerts, icon: AlertTriangle, color: "#ef4444", subtext: "Needs attention" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "8px",
                padding: "20px",
                boxShadow: theme === "dark" ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{
                  padding: "8px",
                  backgroundColor: theme === "dark"
                    ? `${kpi.color}18`
                    : `${kpi.color}10`,
                  borderRadius: "8px",
                }}>
                  <kpi.icon style={{ width: "22px", height: "22px", color: kpi.color }} />
                </div>
              </div>
              <p style={{ fontSize: "13px", color: currentTheme.textSecondary, margin: "0 0 4px 0" }}>{kpi.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: currentTheme.textPrimary, margin: 0, fontFamily: 'Consolas, monospace' }}>{kpi.value}</p>
              <p style={{ fontSize: "11px", color: currentTheme.textTertiary, marginTop: "6px" }}>{kpi.subtext}</p>
            </div>
          ))}
        </div>

        {/* ── Model Health + Model Versions (side by side on large screens) ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}>
          <ModelHealth data={health} />
          <ModelVersion data={versions} />
        </div>

        {/* ── Model Monitoring (Architecture, Latency, Status, Logs) ── */}
        <div style={{ marginBottom: "24px" }}>
          <ModelMonitoring monitoringData={monitoringData} logsData={logsData} />
        </div>

        {/* ── Run Inference Section ── */}
        <div style={{
          backgroundColor: currentTheme.surface,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: theme === "dark" ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "600",
              color: currentTheme.textPrimary,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <Brain style={{ width: "20px", height: "20px", color: currentTheme.primary }} />
              Run Model Inference
            </h2>
            <button
              onClick={() => { fetchData(); }}
              style={{
                padding: "8px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "4px",
                color: currentTheme.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.hoverBackground;
                e.currentTarget.style.color = currentTheme.textPrimary;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = currentTheme.textSecondary;
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            models={health.map((h) => h.name)}
          />

          {selectedModel && <InferenceForm onSubmit={handleInference} />}
        </div>

        {/* ── Inference Result ── */}
        {result && (
          <div style={{ marginBottom: "24px" }}>
            <InferenceResult result={result} />
          </div>
        )}

        {/* ── Prediction Trends Chart ── */}
        <div style={{ marginBottom: "24px" }}>
          <PredictionChart data={stats} />
        </div>

        {/* ── Prediction History ── */}
        <InferenceHistory
          history={historyData}
          total={historyTotal}
          limit={historyLimit}
          offset={historyOffset}
          onPageChange={(newOffset) => setHistoryOffset(newOffset)}
          onFilterChange={(severity) => {
            setHistoryFilter(severity);
            setHistoryOffset(0);
          }}
        />
      </div>
    </div>
  );
}