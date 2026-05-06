import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { VicidialPopupProvider } from "@/shared/context/VicidialPopupContext";

createRoot(document.getElementById("root")).render(<VicidialPopupProvider><App /></VicidialPopupProvider>);
