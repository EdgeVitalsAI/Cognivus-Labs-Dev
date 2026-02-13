export default function InferenceResult({ result }) {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">Inference Result</h2>

      <div className="space-y-2">
        <p>
          <strong>Prediction:</strong> {result.prediction}
        </p>

        <p>
          <strong>Confidence:</strong>{" "}
          {(result.confidence * 100).toFixed(2)}%
        </p>

        <p>
          <strong>Timestamp:</strong> {result.timestamp}
        </p>
      </div>
    </div>
  );
}
