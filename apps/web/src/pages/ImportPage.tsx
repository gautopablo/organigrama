import { useState } from "react";
import { uploadSource } from "../lib/api";

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function onSubmit() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await uploadSource(file);
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Importación</h2>
      <p>Subí una fuente para ejecutar staging, matching y creación de conflictos.</p>
      <div className="panel">
        <input type="file" accept=".csv,.json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" disabled={!file || loading} onClick={() => void onSubmit()}>
          {loading ? "Procesando..." : "Subir y reconciliar"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <h3>Resultado</h3>
          <pre>{result}</pre>
        </>
      )}
    </section>
  );
}
