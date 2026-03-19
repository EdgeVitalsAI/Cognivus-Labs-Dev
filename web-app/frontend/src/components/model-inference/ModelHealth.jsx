export default function ModelHealth({ data }) {
  return (
    <div className="p-4 bg-slate-800 rounded">
      <h2 className="font-semibold mb-3">Model Health</h2>

      <div className="grid grid-cols-2 gap-3">
        {data.map((model, i) => (
          <div key={i} className="p-3 bg-slate-700 rounded">
            <p className="font-medium">{model.name}</p>
            <p>Status: {model.status}</p>
            <p>Latency: {model.latency} ms</p>
          </div>
        ))}
      </div>
    </div>
  );
}