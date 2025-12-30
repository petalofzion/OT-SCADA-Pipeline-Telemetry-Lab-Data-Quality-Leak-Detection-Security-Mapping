import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import telemetryCsv from './data/telemetry.csv?raw';
import labelsData from './data/labels.json';
import alertsData from './data/alerts.json';
import assetsData from './data/assets.json';
import reportData from './data/report.json';

const parseTelemetry = (csvText) => {
  const [headerLine, ...rows] = csvText.trim().split('\n');
  const headers = headerLine.replace('\r', '').split(',');
  return rows.map((row) => {
    const values = row.replace('\r', '').split(',');
    return headers.reduce((acc, header, index) => {
      const value = values[index];
      if (header === 'timestamp') {
        acc[header] = value;
      } else {
        const numeric = Number(value);
        acc[header] = Number.isNaN(numeric) ? null : numeric;
      }
      return acc;
    }, {});
  });
};

const addCleanedTelemetry = (rows, windowSize = 5) =>
  rows.map((row, index) => {
    const start = Math.max(index - windowSize + 1, 0);
    const slice = rows.slice(start, index + 1);
    const average = (key) => {
      const valid = slice.map((entry) => entry[key]).filter((value) => value !== null);
      if (valid.length === 0) {
        return null;
      }
      return valid.reduce((total, value) => total + value, 0) / valid.length;
    };
    return {
      ...row,
      flowCleaned: average('flow'),
      pressureCleaned: average('pressure'),
      temperatureCleaned: average('temperature')
    };
  });

const formatWindow = (start, end) =>
  `${start.slice(11, 16)} → ${end.slice(11, 16)}`;

export default function App() {
  const [showRaw, setShowRaw] = useState(true);
  const [showCleaned, setShowCleaned] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  const telemetry = useMemo(
    () => addCleanedTelemetry(parseTelemetry(telemetryCsv)),
    []
  );

  const labelRanges = useMemo(
    () =>
      labelsData
        .map((label) => {
          const start = telemetry[label.start_index]?.timestamp;
          const end = telemetry[label.end_index]?.timestamp;
          if (!start || !end) {
            return null;
          }
          return {
            ...label,
            start,
            end,
            window: formatWindow(start, end)
          };
        })
        .filter(Boolean),
    [telemetry]
  );

  const alertRanges = useMemo(
    () =>
      alertsData
        .map((alert) => {
          const start = telemetry[alert.start_index]?.timestamp;
          const end = telemetry[alert.end_index]?.timestamp;
          if (!start || !end) {
            return null;
          }
          return {
            ...alert,
            start,
            end,
            window: formatWindow(start, end)
          };
        })
        .filter(Boolean),
    [telemetry]
  );

  const handleReportExport = () => {
    const blob = new window.Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'report.json';
    link.click();
    window.URL.revokeObjectURL(url);
  };

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
        <h2>Time-Series View</h2>
        <div className="chart">
          <div className="chart-shell" data-testid="telemetry-chart">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={telemetry} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#d7def4" />
                <XAxis dataKey="timestamp" tickFormatter={(value) => value.slice(11, 16)} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value === null ? '—' : value.toFixed(2),
                    name
                  ]}
                  labelFormatter={(label) => `Timestamp: ${label}`}
                />
                <Legend />
                {showLabels &&
                  labelRanges.map((label) => (
                    <ReferenceArea
                      key={label.id}
                      x1={label.start}
                      x2={label.end}
                      className="overlay overlay-label"
                    />
                  ))}
                {showAlerts &&
                  alertRanges.map((alert) => (
                    <ReferenceArea
                      key={alert.id}
                      x1={alert.start}
                      x2={alert.end}
                      className="overlay overlay-alert"
                    />
                  ))}
                {showRaw && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="flow"
                      stroke="#2563eb"
                      dot={false}
                      name="flow (raw)"
                    />
                    <Line
                      type="monotone"
                      dataKey="pressure"
                      stroke="#16a34a"
                      dot={false}
                      name="pressure (raw)"
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f97316"
                      dot={false}
                      name="temperature (raw)"
                    />
                  </>
                )}
                {showCleaned && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="flowCleaned"
                      stroke="#1d4ed8"
                      strokeDasharray="6 4"
                      dot={false}
                      name="flow (cleaned)"
                    />
                    <Line
                      type="monotone"
                      dataKey="pressureCleaned"
                      stroke="#15803d"
                      strokeDasharray="6 4"
                      dot={false}
                      name="pressure (cleaned)"
                    />
                    <Line
                      type="monotone"
                      dataKey="temperatureCleaned"
                      stroke="#ea580c"
                      strokeDasharray="6 4"
                      dot={false}
                      name="temperature (cleaned)"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="toggles">
          <label>
            <input
              type="checkbox"
              checked={showRaw}
              onChange={(event) => setShowRaw(event.target.checked)}
            />
            Show raw data
          </label>
          <label>
            <input
              type="checkbox"
              checked={showCleaned}
              onChange={(event) => setShowCleaned(event.target.checked)}
            />
            Show cleaned data
          </label>
          <label>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(event) => setShowLabels(event.target.checked)}
            />
            Show data quality labels
          </label>
          <label>
            <input
              type="checkbox"
              checked={showAlerts}
              onChange={(event) => setShowAlerts(event.target.checked)}
            />
            Show leak alarms
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
              {alertRanges.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.id}</td>
                  <td>{alert.severity}</td>
                  <td>{alert.window}</td>
                  <td>{alert.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={handleReportExport}>
            Export incident report (JSON)
          </button>
        </div>
        <div>
          <h2>Data Quality Labels</h2>
          <ul>
            {labelRanges.map((label) => (
              <li key={label.id}>
                <strong>{label.kind}</strong> — {label.window}
                <span className="label-reason">({label.reason})</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel">
        <h2>Asset &amp; Comms Map</h2>
        <div className="asset-grid">
          {assetsData.map((asset) => (
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
