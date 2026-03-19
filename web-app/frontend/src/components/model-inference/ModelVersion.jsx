export default function ModelVersion({ data }) {
  return (
    <div className="p-4 bg-slate-800 rounded">
      <h2 className="font-semibold mb-3">Model Versions</h2>

      {data.map((model, i) => (
        <div key={i} className="p-2 border-b border-slate-700">
          <p>{model.name}</p>
          <p className="text-sm text-slate-400">
            Version: {model.version}
          </p>
        </div>
      ))}
    </div>
  );
}