import { AppProviders } from "@/app/AppProviders";
import { AppRoutes } from "@/routes/AppRoutes";
import "@/styles/app.css";
export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
