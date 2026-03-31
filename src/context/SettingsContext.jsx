import React, { createContext, useState, useEffect, useContext } from "react";
import AxiosInstance from "../Utils/AxiosInstance";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await AxiosInstance.get(
          "http://localhost:3000/api/settings",
        );
        setSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch global settings:", error);
        // Set fallback settings on error
        setSettings({
          siteName: "ServiceNest",
          supportEmail: "servicenest358@gmail.com",
          supportPhone: "+91 93929 57585",
          enableRegistration: true,
          enablePromoBanner: true,
          requireOtpForUpdates: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};