import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Revenue {
  agent_id: number;
  total_revenue: string;
  transaction_count: number;
  unique_clients: number;
}

interface Client {
  address: string;
  total_spent: string;
  transaction_count: number;
  last_payment: number;
}

interface Service {
  service_id: string;
  total_revenue: string;
  call_count: number;
}

interface Prediction {
  agent_id: number;
  endpoint: string;
  predicted_revenue_30d: string;
  confidence: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useRevenue(agentId: string) {
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJson<Revenue>(`${API_BASE}/agent/${agentId}/revenue`)
      .then(setRevenue)
      .catch(() => setRevenue(null))
      .finally(() => setLoading(false));
  }, [agentId]);

  return { revenue, loading };
}

export function useClients(agentId: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJson<{ clients: Client[] }>(`${API_BASE}/agent/${agentId}/clients`)
      .then((d) => setClients(d.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [agentId]);

  return { clients, loading };
}

export function useServices(agentId: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJson<{ services: Service[] }>(`${API_BASE}/agent/${agentId}/services`)
      .then((d) => setServices(d.services || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [agentId]);

  return { services, loading };
}

export function usePredict(agentId: string) {
  const [predict, setPredict] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = useCallback(
    async (endpoint: string) => {
      setPredict(endpoint);
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_id: parseInt(agentId), endpoint }),
        });
        const data: Prediction = await res.json();
        setPrediction(data);
      } catch {
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    },
    [agentId]
  );

  return { predict, prediction, loading, runPrediction };
}
