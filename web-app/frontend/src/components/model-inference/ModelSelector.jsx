export default function ModelSelector({ selectedModel, setSelectedModel }) {
  const models = [
    "Heart Risk Model",
    "Stroke Prediction Model",
    "Diabetes Risk Model",
    "Sepsis Detection Model",
  ];

  return (
    <div>
      <label className="block mb-2 font-medium">Select Model</label>
      <select
        className="w-full p-2 border rounded"
        value={selectedModel || ""}
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        <option value="">-- Select a Model --</option>
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}
