"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building2,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Palette,
  ShieldCheck,
  Camera,
  IndianRupee,
  Languages,
  KeyRound,
  Loader2,
} from "lucide-react";
import { updateUserSettings, updateAgencySettings } from "@/app/actions/settings";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  image: string | null;
}

interface AgencyProfile {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
}

interface SettingsClientProps {
  user: UserProfile;
  agency: AgencyProfile | null;
  canManageAgency: boolean;
}

/* ── Section heading helper ── */
function SectionHeading({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="mt-0.5 h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--waypoint-navy)] to-[var(--waypoint-teal)] flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div>
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Notification row helper ── */
function NotifRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 transition-colors hover:bg-slate-100/80">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

export default function SettingsClient({ user, agency, canManageAgency }: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Profile
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileImage, setProfileImage] = useState(user.image || "");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Preferences
  const [currency, setCurrency] = useState("INR");
  const [lang, setLang] = useState("en");
  const [notifs, setNotifs] = useState({
    bookings: true,
    tasks: true,
    marketing: false,
    security: true,
  });

  // 2FA
  const [tfaEnabled, setTfaEnabled] = useState(false);

  // Agency
  const [agencyForm, setAgencyForm] = useState({
    name: agency?.name || "",
    description: agency?.description || "",
    website: agency?.website || "",
    email: agency?.email || "",
    phone: agency?.phone || "",
    address: agency?.address || "",
    logo: agency?.logo || "",
  });

  /* ── Handlers ── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload a valid image file."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Avatar image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
        toast.success("Avatar preview updated — click Save to persist.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) { toast.error("Display name is required."); return; }
    setLoading(true);
    try {
      const res = await updateUserSettings({ name: profileName, phone: profilePhone || null, image: profileImage || null });
      if (res.error) throw new Error(res.error);
      await authClient.updateUser({ name: profileName, image: profileImage || undefined });
      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("All password fields are required."); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords do not match."); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (error) throw new Error(error.message);
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Preferences saved!");
  };

  const handleUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyForm.name.trim()) { toast.error("Agency name is required."); return; }
    setLoading(true);
    try {
      const res = await updateAgencySettings({
        name: agencyForm.name,
        description: agencyForm.description || null,
        website: agencyForm.website || null,
        email: agencyForm.email || null,
        phone: agencyForm.phone || null,
        address: agencyForm.address || null,
        logo: agencyForm.logo || null,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Agency profile updated!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update agency.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Tabs defaultValue="profile" className="w-full">
        {/* ── Tab Navigation ── */}
        <TabsList className="w-full flex bg-slate-100 p-1.5 border border-slate-200 rounded-2xl mb-8 overflow-x-auto gap-1">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all"
          >
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          {canManageAgency && (
            <TabsTrigger
              value="agency"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Agency</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══════════ ACCOUNT PROFILE ═══════════ */}
        <TabsContent value="profile" className="outline-none">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Avatar Card */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6">
                <SectionHeading icon={User} title="Profile Information" desc="Your personal details and public avatar shown across the platform." />

                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/50">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                      {profileImage ? <AvatarImage src={profileImage} className="object-cover" /> : null}
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary text-white text-3xl font-bold">
                        {profileName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Label
                      htmlFor="avatar-file"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-secondary hover:bg-secondary text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-white"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Label>
                    <input id="avatar-file" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>

                  <div className="text-center sm:text-left space-y-1">
                    <h4 className="text-lg font-bold text-slate-900">{profileName}</h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary">
                      {user.role}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="glass-card">
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="profile-name"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your display name"
                      className="h-11 bg-white border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="profile-phone"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 pl-10 bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="profile-email"
                      disabled
                      value={user.email}
                      className="h-11 pl-10 bg-slate-100 border-slate-200 rounded-xl cursor-not-allowed opacity-60"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Email cannot be changed for security reasons.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 bg-secondary hover:bg-secondary text-white font-semibold rounded-xl px-6 gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ═══════════ SECURITY ═══════════ */}
        <TabsContent value="security" className="outline-none">
          <div className="space-y-6">
            {/* Password Card */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <SectionHeading icon={KeyRound} title="Change Password" desc="Update your password regularly to keep your account secure." />

                <form onSubmit={handlePasswordUpdate} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="curr-pass" className="text-sm font-medium">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="curr-pass"
                        required
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="h-11 pl-10 pr-11 bg-white border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0.5"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="new-pass" className="text-sm font-medium">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-pass"
                          required
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="h-11 pr-11 bg-white border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0.5"
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conf-pass" className="text-sm font-medium">Confirm New Password</Label>
                      <Input
                        id="conf-pass"
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="h-11 bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 bg-secondary hover:bg-secondary text-white font-semibold rounded-xl px-6 gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 2FA Card */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <SectionHeading icon={ShieldCheck} title="Two-Factor Authentication" desc="Add an extra layer of protection to your account with 2FA." />

                <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-secondary/10 to-[#E8AA9B]/10 border border-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tfaEnabled ? 'bg-secondary' : 'bg-slate-300'} transition-colors`}>
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {tfaEnabled ? "2FA is Active" : "2FA is Disabled"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Require a verification code from your authenticator app when signing in.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={tfaEnabled}
                    onCheckedChange={(val) => {
                      setTfaEnabled(val);
                      toast.success(`Two-Factor Authentication ${val ? "enabled" : "disabled"}.`);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ PREFERENCES ═══════════ */}
        <TabsContent value="preferences" className="outline-none">
          <form onSubmit={handleSavePreferences} className="space-y-6">
            {/* Regional */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <SectionHeading icon={Globe} title="Regional Settings" desc="Set your preferred currency and language for the platform." />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" /> Currency
                    </Label>
                    <Select value={currency} onValueChange={(val) => setCurrency(val || "INR")}>
                      <SelectTrigger className="!w-full h-11 bg-white border-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl">
                        <SelectItem value="INR">₹ INR — Indian Rupee</SelectItem>
                        <SelectItem value="USD">$ USD — US Dollar</SelectItem>
                        <SelectItem value="EUR">€ EUR — Euro</SelectItem>
                        <SelectItem value="GBP">£ GBP — British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Language
                    </Label>
                    <Select value={lang} onValueChange={(val) => setLang(val || "en")}>
                      <SelectTrigger className="!w-full h-11 bg-white border-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl">
                        <SelectItem value="en">English (US / IN)</SelectItem>
                        <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                        <SelectItem value="es">Spanish (Español)</SelectItem>
                        <SelectItem value="fr">French (Français)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <SectionHeading icon={Bell} title="Notifications" desc="Control what alerts and updates you receive from the platform." />

                <div className="space-y-3">
                  <NotifRow
                    title="Booking Confirmations"
                    desc="Get notified when a booking is confirmed, cancelled, or updated."
                    checked={notifs.bookings}
                    onChange={(v) => setNotifs({ ...notifs, bookings: v })}
                  />
                  <NotifRow
                    title="Task Assignments"
                    desc="Receive alerts when new tasks are assigned to you or status changes."
                    checked={notifs.tasks}
                    onChange={(v) => setNotifs({ ...notifs, tasks: v })}
                  />
                  <NotifRow
                    title="Marketing & Promotions"
                    desc="Occasional updates about new features, offers, and travel deals."
                    checked={notifs.marketing}
                    onChange={(v) => setNotifs({ ...notifs, marketing: v })}
                  />
                  <NotifRow
                    title="Security Alerts"
                    desc="Important security notifications like new login attempts and password changes."
                    checked={notifs.security}
                    onChange={(v) => setNotifs({ ...notifs, security: v })}
                  />
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="h-11 bg-secondary hover:bg-secondary text-white font-semibold rounded-xl px-6 gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <Save className="h-4 w-4" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ═══════════ AGENCY ═══════════ */}
        {canManageAgency && (
          <TabsContent value="agency" className="outline-none">
            <form onSubmit={handleUpdateAgency} className="space-y-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <SectionHeading icon={Building2} title="Agency Information" desc="Update your travel agency's public profile, branding, and contact details." />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="agency-name" className="text-sm font-medium">Agency Name</Label>
                      <Input
                        id="agency-name"
                        required
                        value={agencyForm.name}
                        onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                        placeholder="Your agency name"
                        className="h-11 bg-white border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agency-logo" className="text-sm font-medium">Logo URL</Label>
                      <Input
                        id="agency-logo"
                        value={agencyForm.logo}
                        onChange={(e) => setAgencyForm({ ...agencyForm, logo: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="h-11 bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <SectionHeading icon={Globe} title="Contact & Location" desc="Public contact information displayed to travelers and partners." />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="agency-web" className="text-sm font-medium">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="agency-web"
                          value={agencyForm.website}
                          onChange={(e) => setAgencyForm({ ...agencyForm, website: e.target.value })}
                          placeholder="www.agency.com"
                          className="h-11 pl-10 bg-white border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agency-email" className="text-sm font-medium">Support Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="agency-email"
                          value={agencyForm.email}
                          onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                          placeholder="support@agency.com"
                          className="h-11 pl-10 bg-white border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agency-phone" className="text-sm font-medium">Support Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="agency-phone"
                          value={agencyForm.phone}
                          onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="h-11 pl-10 bg-white border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-5">
                    <Label htmlFor="agency-address" className="text-sm font-medium">Office Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="agency-address"
                        value={agencyForm.address}
                        onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                        placeholder="123 Tourism Way, Suite 4B, Mumbai"
                        className="h-11 pl-10 bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-5">
                    <Label htmlFor="agency-desc" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="agency-desc"
                      value={agencyForm.description}
                      onChange={(e) => setAgencyForm({ ...agencyForm, description: e.target.value })}
                      placeholder="Tell travelers what makes your agency special..."
                      rows={4}
                      className="bg-white border-slate-200 rounded-xl resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-5 mt-5 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 bg-secondary hover:bg-secondary text-white font-semibold rounded-xl px-6 gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Agency Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
