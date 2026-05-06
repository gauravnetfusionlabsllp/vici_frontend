import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Info } from "lucide-react";

export function useToast() {
  const success = (message) => {
    toast.success(message, {
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      style: {
        background: "rgba(15,23,42,0.95)", // dark card background
        color: "#f1f5f9", // text color
        fontFamily: "Inter, sans-serif",
        border: "1px solid rgba(100,116,139,0.3)",
        borderRadius: "0.5rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      },
    });
  };

  const error = (message) => {
    toast.error(message, {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      style: {
        background: "rgba(15,23,42,0.95)",
        color: "#f1f5f9",
        fontFamily: "Inter, sans-serif",
        border: "1px solid rgba(248,113,113,0.3)",
        borderRadius: "0.5rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      },
    });
  };

  const info = (message) => {
    toast(message, {
      duration: 8000,
      icon: <Info className="w-5 h-5 text-sky-400" />,
      style: {
        background: "rgba(15,23,42,0.95)",
        color: "#f1f5f9",
        fontFamily: "Inter, sans-serif",
        border: "1px solid rgba(56,189,248,0.3)",
        borderRadius: "0.5rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      },
    });
  };

  return { success, error, info };
}
