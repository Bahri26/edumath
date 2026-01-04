import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { registerApiErrorNotifier } from "../services/api";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Register global API error notifier
  useEffect(() => {
    registerApiErrorNotifier(showToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-white font-medium animate-fade-in ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-slate-800"}`}
            role="alert"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
