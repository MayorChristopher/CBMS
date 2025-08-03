import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface EngagementMetric {
  customer_id: string;
  engagement_score: number | null;
  bounce_rate: number | null;
  conversion_rate: number | null;
}

interface Session {
  id: string;
  customer_id: string | null;
  session_start: string;
  session_end: string | null;
  duration: string | null;
  pages_visited: number | null;
  device_type: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
}

export function CustomerEngagementDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<Record<string, EngagementMetric>>({});
  const [sessions, setSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch customers
      const { data: customersData } = await supabase.from("customers").select("id, email, first_name, last_name");
      setCustomers(customersData || []);
      // Fetch engagement metrics
      const { data: metricsData } = await supabase.from("engagement_metrics").select("customer_id, engagement_score, bounce_rate, conversion_rate");
      const metricsMap: Record<string, EngagementMetric> = {};
      (metricsData || []).forEach((m: EngagementMetric) => {
        metricsMap[m.customer_id] = m;
      });
      setMetrics(metricsMap);
      // Fetch sessions
      const { data: sessionsData } = await supabase.from("sessions").select("id, customer_id, session_start, session_end, duration, pages_visited, device_type, ip_address, user_agent, referrer");
      const sessionsMap: Record<string, Session[]> = {};
      (sessionsData || []).forEach((s: Session) => {
        if (!sessionsMap[s.customer_id || "unknown"]) sessionsMap[s.customer_id || "unknown"] = [];
        sessionsMap[s.customer_id || "unknown"].push(s);
      });
      setSessions(sessionsMap);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading customer engagement data...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Engagement & Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Engagement Score</th>
              <th>Bounce Rate</th>
              <th>Conversion Rate</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.first_name || ""} {customer.last_name || ""} <br /> <span className="text-muted-foreground">{customer.email}</span></td>
                <td>{metrics[customer.id]?.engagement_score ?? "-"}</td>
                <td>{metrics[customer.id]?.bounce_rate ?? "-"}</td>
                <td>{metrics[customer.id]?.conversion_rate ?? "-"}</td>
                <td>
                  {sessions[customer.id]?.length || 0}
                  {sessions[customer.id]?.length > 0 && (
                    <details>
                      <summary>View</summary>
                      <ul>
                        {sessions[customer.id].map((s) => (
                          <li key={s.id}>
                            Start: {s.session_start}, End: {s.session_end || "-"}, Duration: {s.duration || "-"}, Pages: {s.pages_visited || 0}, Device: {s.device_type || "-"}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
