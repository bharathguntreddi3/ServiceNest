import React, { useState, useEffect } from "react";
import AxiosInstance from "../Utils/AxiosInstance";

export default function AdminSettings({
  initialSettings,
  onSettingsSave,
  showAlert,
}) {
  const [settings, setSettings] = useState(
    initialSettings || {
      siteName: "ServiceNest",
      supportEmail: "servicenest358@gmail.com",
      supportPhone: "+91 93929 57585",
      enableRegistration: true,
      enablePromoBanner: true,
      requireOtpForUpdates: true,
      sessionTimeout: 120,
    },
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await AxiosInstance.put("/api/admin/settings", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onSettingsSave) {
        onSettingsSave(settings);
      }
      showAlert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      showAlert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h2 className="admin-header">Platform Settings</h2>
      <div
        className="admin-table-wrapper"
        style={{ display: "flex", flexDirection: "column", gap: "40px" }}
      >
        {/* General Settings */}
        <section>
          <h3
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
              color: "#333",
              marginTop: 0,
            }}
          >
            General Configuration
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>Site Name</label>
              <input
                type="text"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
              />
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>Support Email</label>
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleChange}
              />
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>Support Phone</label>
              <input
                type="text"
                name="supportPhone"
                value={settings.supportPhone}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h3
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            Preferences & Features
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                name="enableRegistration"
                checked={settings.enableRegistration}
                onChange={handleChange}
              />
              Allow new user registrations
            </label>
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                name="enablePromoBanner"
                checked={settings.enablePromoBanner}
                onChange={handleChange}
              />
              Show promotional banner on the homepage
            </label>
          </div>
        </section>

        {/* Security */}
        <section>
          <h3
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            Security
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                name="requireOtpForUpdates"
                checked={settings.requireOtpForUpdates}
                onChange={handleChange}
              />
              Require OTP verification for profile updates (Email/Phone)
            </label>
            <div
              className="admin-form-group"
              style={{ maxWidth: "300px", marginBottom: 0 }}
            >
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: "20px",
            display: "flex",
            gap: "15px",
          }}
        >
          <button
            className="admin-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: "12px 24px", fontSize: "15px" }}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button
            className="admin-btn-secondary"
            onClick={() => showAlert("Cache cleared successfully!")}
            style={{ padding: "12px 24px", fontSize: "15px" }}
          >
            Clear System Cache
          </button>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .settings-checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #555;
          font-size: 15px;
        }
        .settings-checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
          cursor: pointer;
        }
      `,
        }}
      />
    </>
  );
}
