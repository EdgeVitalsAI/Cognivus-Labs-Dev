import { useState } from "react";

export default function InferenceForm({ onSubmit }) {
  const [inputData, setInputData] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let parsedData;
    try {
      parsedData = JSON.parse(inputData);
    } catch {
      alert("Input must be valid JSON");
      return;
    }

    onSubmit(parsedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block font-medium">
        Enter Model Input (JSON format)
      </label>

      <textarea
        rows="6"
        className="w-full p-2 border rounded"
        placeholder='Example: { "age": 65, "bp": 120 }'
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
      />

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Run Inference
      </button>
    </form>
  );
}
