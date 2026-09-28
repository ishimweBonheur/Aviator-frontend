import { useSyncExternalStore } from "react";
import { session } from "../services/session";
export const useSession = () =>
  useSyncExternalStore(session.subscribe, session.getSnapshot);
