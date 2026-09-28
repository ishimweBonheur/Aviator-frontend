import { useCallback, useContext, useEffect, useState } from "react";
import { isAuthorizationError } from "@/services/api";
import { adminRequest, type Row, type Analytics } from "./admin.api";
import { AdminAccessContext } from "./admin-access.context";
export function useAdminData(
  resource: string,
  options: { live?: boolean; charts?: boolean; poll?: boolean } = {},
) {
  const { live = false, charts = false, poll = false } = options;
  const onDenied = useContext(AdminAccessContext);
  const [data, setData] = useState<Row>();
  const [current, setCurrent] = useState<Row>();
  const [analytics, setAnalytics] = useState<Analytics>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [updated, setUpdated] = useState("");
  const refresh = useCallback(() => {
    setLoading(true);
    setVersion((n) => n + 1);
  }, []);
  useEffect(() => {
    let active = true;
    let pending = false;
    const search = new URLSearchParams(query);
    search.set("page", String(page));
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const [result, stats, snapshot] = await Promise.all([
          adminRequest<Row>(resource + "?" + search),
          charts ? adminRequest<Analytics>("analytics?" + query) : undefined,
          live ? adminRequest<Row>("game/current") : undefined,
        ]);
        if (active) {
          setData(result);
          setAnalytics(stats);
          setCurrent(snapshot);
          setError("");
          setUpdated(new Date().toLocaleTimeString());
        }
      } catch (e) {
        if (active) {
          const err = e as Error;
          setError(err.message);
          if (isAuthorizationError(err)) onDenied(err);
        }
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = poll ? setInterval(() => void load(), 10000) : undefined;
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [resource, query, page, version, live, charts, poll, onDenied]);
  return {
    data,
    current,
    analytics,
    error,
    setError,
    loading,
    updated,
    refresh,
    page,
    apply: (value: string) => {
      setQuery(value);
      setPage(1);
      refresh();
    },
    goToPage: (value: number) => {
      setPage(value);
      setLoading(true);
    },
  };
}
