import { useEffect, useMemo, useRef, useState } from 'react';
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
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import telemetryCsv from './data/telemetry.csv?raw';
import labelsData from './data/labels.json';
import alertsData from './data/alerts.json';
import commsModel from '../../data/asset_comms.json';
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
  const graphRef = useRef(null);

  const telemetry = useMemo(
    () => addCleanedTelemetry(parseTelemetry(telemetryCsv)),
    []
  );

  const trustBoundaryMap = useMemo(
    () =>
      new Map(
        commsModel.trustBoundaries.map((boundary) => [boundary.id, boundary])
      ),
    []
  );

  const accessLevelColors = useMemo(
    () => ({
      operator: '#16a34a',
      engineer: '#f59e0b',
      admin: '#ec4899'
    }),
    []
  );

  const edgeAccessColors = useMemo(
    () => ({
      telemetry: '#0ea5e9',
      control: '#f97316',
      admin: '#ef4444'
    }),
    []
  );

  const graphData = useMemo(() => {
    const nodes = commsModel.assets.map((asset) => {
      const boundary = trustBoundaryMap.get(asset.trustBoundary);
      return {
        id: asset.id,
        label: `${asset.name}\n${asset.role}`,
        color: {
          background: accessLevelColors[asset.accessLevel] || '#94a3b8',
          border: boundary?.color || '#334155'
        },
        title: `${asset.name} (${asset.role})\nAccess: ${asset.accessLevel}\nBoundary: ${boundary?.label ?? 'Unknown'}`
      };
    });

    const edges = commsModel.communications.map((link) => ({
      id: link.id,
      from: link.source,
      to: link.target,
      label: `${link.protocol}\n${link.accessLevel}`,
      dashes: link.crossesBoundary,
      color: {
        color: edgeAccessColors[link.accessLevel] || '#64748b'
      },
      font: {
        color: '#1f2937',
        size: 11,
        align: 'middle'
      },
      title: link.note
    }));

    return { nodes, edges };
  }, [accessLevelColors, edgeAccessColors, trustBoundaryMap]);

  useEffect(() => {
    if (!graphRef.current) {
      return undefined;
    }

    const nodes = new DataSet(graphData.nodes);
    const edges = new DataSet(graphData.edges);
    const network = new Network(
      graphRef.current,
      { nodes, edges },
      {
        autoResize: true,
        layout: {
          improvedLayout: true
        },
        nodes: {
          shape: 'box',
          margin: 12,
          widthConstraint: { maximum: 180 },
          font: {
            color: '#0f172a',
            size: 12
          }
        },
        edges: {
          arrows: {
            to: { enabled: true, scaleFactor: 0.6 }
          },
          smooth: {
            type: 'dynamic'
          }
        },
        physics: {
          stabilization: true,
          barnesHut: {
            springLength: 150,
            springConstant: 0.04
          }
        },
        interaction: {
          hover: true
        }
      }
    );

    return () => network.destroy();
  }, [graphData]);

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
        <div className="graph-shell" ref={graphRef} data-testid="asset-graph" />
        <div className="graph-legend">
          <div>
            <h3>Access levels</h3>
            <div className="legend-row">
              <span
                className="legend-swatch"
                style={{ backgroundColor: accessLevelColors.operator }}
              />
              Operator
            </div>
            <div className="legend-row">
              <span
                className="legend-swatch"
                style={{ backgroundColor: accessLevelColors.engineer }}
              />
              Engineer
            </div>
            <div className="legend-row">
              <span
                className="legend-swatch"
                style={{ backgroundColor: accessLevelColors.admin }}
              />
              Admin
            </div>
          </div>
          <div>
            <h3>Trust boundaries</h3>
            {commsModel.trustBoundaries.map((boundary) => (
              <div className="legend-row" key={boundary.id}>
                <span
                  className="legend-swatch legend-border"
                  style={{ borderColor: boundary.color }}
                />
                {boundary.label}
              </div>
            ))}
          </div>
          <div>
            <h3>Comms</h3>
            <div className="legend-row">
              <span
                className="legend-line"
                style={{ backgroundColor: edgeAccessColors.telemetry }}
              />
              Telemetry
            </div>
            <div className="legend-row">
              <span
                className="legend-line"
                style={{ backgroundColor: edgeAccessColors.control }}
              />
              Control
            </div>
            <div className="legend-row">
              <span
                className="legend-line legend-dashed"
                style={{ borderColor: edgeAccessColors.admin }}
              />
              Admin (dashed = boundary crossing)
            </div>
          </div>
        </div>
        <p className="caption">
          Each node is colored by access level and bordered by OT trust boundary.
          Dashed edges indicate communications that traverse zones.
        </p>
      </section>
    </div>
  );
}
