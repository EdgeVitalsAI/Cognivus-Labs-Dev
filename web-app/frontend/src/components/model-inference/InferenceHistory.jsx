export default function InferenceHistory({ history }) {
  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-semibold mb-4">Inference History</h2>

      {history.length === 0 && <p>No inferences yet.</p>}

      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={index}
            className="p-3 border rounded bg-white shadow-sm"
          >
            <p className="font-medium">{item.model}</p>
            <p>Prediction: {item.result.prediction}</p>
            <p>
              Confidence:{" "}
              {(item.result.confidence * 100).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
