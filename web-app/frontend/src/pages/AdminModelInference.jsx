import { useEffect, useState } from "react";
import ModelSelector from "../components/model-inference/ModelSelector";
import InferenceForm from "../components/model-inference/InferenceForm";
import InferenceResult from "../components/model-inference/InferenceResult";
import InferenceHistory from "../components/model-inference/InferenceHistory";
import ModelHealth from "../components/model-inference/ModelHealth";
import ModelVersion from "../components/model-inference/ModelVersion";
import PredictionChart from "../components/model-inference/PredictionChart";

import {
  runInference,
  getModelHealth,
  getModelVersions,
  getPredictionStats,
} from "../services/modelApi";

export default function AdminModelInference() {
  const [selectedModel, setSelectedModel] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState([]);
  const [versions, setVersions] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [h, v, s] = await Promise.all([
        getModelHealth(),
        getModelVersions(),
        getPredictionStats(),
      ]);

      setHealth(h.data);
      setVersions(v.data);
      setStats(s.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInference = async (input) => {
    try {
      const res = await runInference({
        model_name: selectedModel,
        input,
      });

      setResult(res.data);
      setHistory((prev) => [res.data, ...prev]);
    } catch (err) {
      alert("Inference failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Model Control Panel</h1>

      <ModelHealth data={health} />
      <ModelVersion data={versions} />

      <ModelSelector
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {selectedModel && (
        <InferenceForm onSubmit={handleInference} />
      )}

      {result && <InferenceResult result={result} />}

      <PredictionChart data={stats} />

      <InferenceHistory history={history} />
    </div>
  );
}