import { useState } from "react";
import ModelSelector from "../components/model-inference/ModelSelector";
import InferenceForm from "../components/model-inference/InferenceForm";
import InferenceResult from "../components/model-inference/InferenceResult";
import InferenceHistory from "../components/model-inference/InferenceHistory";
import api from "../services/api";

export default function AdminModelInference() {
  const [selectedModel, setSelectedModel] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleInference = async (inputData) => {
    try {
      const response = await api.post("/admin/model-inference", {
        model_name: selectedModel,
        input: inputData,
      });

      setResult(response.data);

      setHistory((prev) => [
        { model: selectedModel, result: response.data },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      alert("Inference failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Model Inference Panel</h1>

      <ModelSelector
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {selectedModel && (
        <InferenceForm onSubmit={handleInference} />
      )}

      {result && <InferenceResult result={result} />}

      <InferenceHistory history={history} />
    </div>
  );
}
