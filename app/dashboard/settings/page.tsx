import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and platform preferences.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive booking confirmations and updates
                  </p>
                </div>
                <span className="text-xs text-emerald-500 font-medium">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Default Currency</p>
                  <p className="text-xs text-muted-foreground">
                    All prices displayed in this currency
                  </p>
                </div>
                <span className="text-xs font-medium">INR (₹)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-muted-foreground">
                    Interface language
                  </p>
                </div>
                <span className="text-xs font-medium">English</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 text-rose-500">
              Danger Zone
            </h3>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-200 dark:border-rose-900/30">
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                Delete Account
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
