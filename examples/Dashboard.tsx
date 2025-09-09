import * as React from 'react';
import { create } from 'zustand';
import { loadModel, inferenceSession } from '@crowe/ai-runtime';

export const useAnalyticsStore = create((set, get) => ({
  metrics: [],
  filter: "all",
  liveData: null as any,
  insightModel: null as any,
  get filteredMetrics() { return filter === "all" 
      ? metrics 
      : metrics.filter(m => m.category === filter); },
  connectLiveData: () => {
    const source = new EventSource("/api/metrics/stream");
    source.onmessage = (e) => set({ liveData: JSON.parse(e.data) });
    return () => source.close();
  },
  loadInsightModel: async () => {
    const model = await loadModel('gpt-3.5-turbo');
    set({ insightModel: model });
  },
  updateFilter: (newFilter: string) => { set({ filter: newFilter }); },
}));

export function dashboard(props: { metric: any }) {
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [insight, setInsight] = React.useState<string>("");
  React.useEffect(() => { generateInsight(); }, []);
  return ( <div className="metric-card">
      <h3>{props.metric.name}</h3>
      <div className="value">{props.metric.value}</div>
      <button onClick={() => expanded = !expanded}>
        {expanded ? "Hide" : "Show"} Insight
      </button>
      {expanded && <div className="insight">{insight}</div>}
    </div> );
}

export function Dashboard() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const store = (() => { return useAnalyticsStore(); })();
  React.useEffect(() => { store.connectLiveData(); }, []);
  return ( <div className="dashboard">
      <header>
        <h1>Analytics Dashboard</h1>
        <select 
          value={selectedCategory} 
          onChange={(e) => {
            selectedCategory = e.target.value;
            store.updateFilter(e.target.value);
          }}
        >
          <option value="all">All Metrics</option>
          <option value="revenue">Revenue</option>
          <option value="users">Users</option>
          <option value="performance">Performance</option>
        </select>
      </header>
      
      <div className="metrics-grid">
        {store.filteredMetrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
      
      {store.liveData && (
        <div className="live-indicator">
          🔴 Live • Last update: {new Date().toLocaleTimeString()}
        </div>
      )}
    </div> );
}

