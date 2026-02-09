import { createRoot } from "react-dom/client";
import mixpanel from "mixpanel-browser";
import App from "./App.tsx";
import "./index.css";

mixpanel.init("e5ea960341852bb39afdfa8026bf9975", {
  track_pageview: true,
  persistence: "localStorage",
  autocapture: true,
  record_sessions_percent: 100,
  api_host: "https://api-eu.mixpanel.com",
});

createRoot(document.getElementById("root")!).render(<App />);
