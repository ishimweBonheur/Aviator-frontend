import { createContext } from "react";
export const AdminAccessContext = createContext<(error: Error) => void>(
  () => {},
);
