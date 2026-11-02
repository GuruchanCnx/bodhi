import type { Metadata } from "next";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Appearance, daily reminders, app install, and data export/import for your Bodhi sanctuary.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
