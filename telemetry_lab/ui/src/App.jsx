const sampleAlerts = [
  {
    id: 'ALRT-001',
    severity: 'medium',
    reason: 'Sustained flow drop vs EWMA baseline',
    window: '2024-01-01T04:20Z → 04:40Z'
  }
];

const qualityLabels = [
  { id: 'LBL-01', kind: 'missing', window: '01:00 → 01:10' },
  { id: 'LBL-02', kind: 'flatline', window: '02:00 → 02:15' },
  { id: 'LBL-03', kind: 'spike', window: '03:00 → 03:01' },
  { id: 'LBL-04', kind: 'drift', window: '03:40 → 04:00' }
];

const assets = [
  { name: 'Flow Sensor', role: 'Field device', access: 'operator' },
  { name: 'RTU', role: 'Edge control', access: 'engineer' },
  { name: 'Historian', role: 'Storage', access: 'engineer' },
  { name: 'HMI', role: 'Ops dashboard', access: 'operator' },
  { name: 'Analytics Node', role: 'Leak detection', access: 'admin' }
];

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>OT/SCADA Pipeline Telemetry Lab</h1>
        <p>
          Local-first operator dashboard to compare raw vs cleaned telemetry and
          inspect leak alarms.
        </p>
      </header>

      <section className="panel">
        <h2>Time-Series View (Scaffold)</h2>
        <div className="chart">
          <div className="chart-placeholder">
            <p>Chart placeholder</p>
            <p className="caption">
              TODO: Plot flow/pressure/temperature with raw vs cleaned toggles.
            </p>
          </div>
        </div>
        <div className="toggles">
          <label>
            <input type="checkbox" defaultChecked /> Show cleaned data
          </label>
          <label>
            <input type="checkbox" defaultChecked /> Show data quality labels
          </label>
          <label>
            <input type="checkbox" defaultChecked /> Show leak alarms
          </label>
        </div>
      </section>

      <section className="panel grid">
        <div>
          <h2>Leak Alerts</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Window</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {sampleAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.id}</td>
                  <td>{alert.severity}</td>
                  <td>{alert.window}</td>
                  <td>{alert.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button">Export incident report (JSON)</button>
        </div>
        <div>
          <h2>Data Quality Labels</h2>
          <ul>
            {qualityLabels.map((label) => (
              <li key={label.id}>
                <strong>{label.kind}</strong> — {label.window}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel">
        <h2>Asset &amp; Comms Map</h2>
        <div className="asset-grid">
          {assets.map((asset) => (
            <div key={asset.name} className="asset-card">
              <h3>{asset.name}</h3>
              <p>{asset.role}</p>
              <span className={`tag ${asset.access}`}>{asset.access}</span>
            </div>
          ))}
        </div>
        <p className="caption">
          TODO: Replace with a directed graph showing communications and trust
          boundaries.
        </p>
      </section>
    </div>
  );
}
