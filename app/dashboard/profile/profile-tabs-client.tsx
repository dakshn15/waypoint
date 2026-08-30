"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { updateTravelerProfile } from "@/app/actions/profile";
import { updateUserSettings } from "@/app/actions/settings";
import {
  User,
  Compass,
  Lock,
  Camera,
  Mail,
  Globe,
  Calendar,
  CreditCard,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Loader2,
  PhoneCall,
  UserCheck,
} from "lucide-react";

interface ProfileTabsClientProps {
  user: any;
  initialProfile: any;
  tripsCount?: number;
  bookingsCount?: number;
}

/* ── Section heading helper ── */
function SectionHeading({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="mt-0.5 h-9 w-9 rounded-md bg-gradient-to-br from-[var(--waypoint-navy)] to-[var(--waypoint-teal)] flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div>
        <h3 className="text-base font-bold tracking-tight text-slate-900 font-display">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function ProfileTabsClient({
  user,
  initialProfile,
}: ProfileTabsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Account settings state
  const [profileName, setProfileName] = useState(user.name || "");
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileImage, setProfileImage] = useState(user.image || "");

  // Traveler details state
  const [dob, setDob] = useState(
    initialProfile?.dateOfBirth
      ? new Date(initialProfile.dateOfBirth).toISOString().split("T")[0]
      : ""
  );
  const [nationality, setNationality] = useState(initialProfile?.nationality || "");
  const [passport, setPassport] = useState(initialProfile?.passportNumber || "");
  const [emergencyContact, setEmergencyContact] = useState(initialProfile?.emergencyContact || "");
  const [emergencyPhone, setEmergencyPhone] = useState(initialProfile?.emergencyPhone || "");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Handle Avatar Image Selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, GIF)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB to keep database storage size lightweight");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
        toast.success("Avatar preview updated — click Save Changes to persist.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Account Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (profilePhone.trim() && !/^[+\d\s-]{7,20}$/.test(profilePhone.trim())) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserSettings({
        name: profileName.trim(),
        phone: profilePhone.trim() || null,
        image: profileImage || null,
      });
      if (res.error) throw new Error(res.error);
      await authClient.updateUser({
        name: profileName.trim(),
        image: profileImage || undefined,
      });
      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Traveler Profile Update
  const handleTravelerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Date of Birth Validation
    if (dob) {
      const selectedDob = new Date(dob);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDob > today) {
        toast.error("Date of birth cannot be in the future.");
        return;
      }

      const minDob = new Date();
      minDob.setFullYear(today.getFullYear() - 120);
      if (selectedDob < minDob) {
        toast.error("Please enter a valid date of birth.");
        return;
      }
    }

    // 2. Passport Validation
    const cleanPassport = passport.trim().toUpperCase();
    if (cleanPassport && !/^[A-Z0-9]{5,15}$/.test(cleanPassport)) {
      toast.error("Please enter a valid passport number (5–15 alphanumeric characters).");
      return;
    }

    // 3. Emergency Phone Validation
    const cleanEmergencyPhone = emergencyPhone.trim();
    if (cleanEmergencyPhone && !/^[+\d\s-]{7,20}$/.test(cleanEmergencyPhone)) {
      toast.error("Please enter a valid emergency contact phone number.");
      return;
    }

    setLoading(true);
    try {
      await updateTravelerProfile({
        dateOfBirth: dob ? new Date(dob) : null,
        nationality: nationality.trim() || null,
        passportNumber: cleanPassport || null,
        emergencyContact: emergencyContact.trim() || null,
        emergencyPhone: cleanEmergencyPhone || null,
      });
      toast.success("Traveler profile & preferences saved!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update traveler preferences.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <Tabs defaultValue="profile" className="flex md:!flex-row items-start gap-6">
        {/* ── Left Sidebar Tabs Navigation ── */}
        <TabsList className="flex flex-col h-auto w-full xl:w-64 md:w-60 bg-slate-100/80 p-3 border border-slate-200/80 rounded-lg gap-1 shrink-0">
          <TabsTrigger
            value="profile"
            className="w-full justify-start px-3 sm:px-4 sm:py-3 py-2.5 text-sm font-semibold rounded-lg gap-3 cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <User className="h-4 w-4" />
            <span>Account Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="traveler"
            className="w-full justify-start px-3 sm:px-4 sm:py-3 py-2.5 text-sm font-semibold rounded-lg gap-3 cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Compass className="h-4 w-4" />
            <span>Traveler Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="w-full justify-start px-3 sm:px-4 sm:py-3 py-2.5 text-sm font-semibold rounded-lg gap-3 cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Right Content Area ── */}
        <div className="flex-1 w-full space-y-6">

          {/* ═══════════ ACCOUNT PROFILE ═══════════ */}
          <TabsContent value="profile" className="outline-none space-y-6 mt-0">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Header Card */}
              <Card className="glass-card overflow-hidden">
                <CardContent className="sm:px-6 px-4 sm:py-2">
                  <SectionHeading
                    icon={User}
                    title="Profile Information"
                    desc="Your personal details and public avatar shown across the platform."
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/50">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                        {profileImage ? <AvatarImage src={profileImage} className="object-cover" /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary text-white text-3xl font-bold font-display">
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
                      <h4 className="text-lg font-bold text-slate-900 font-display">{profileName}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary">
                        {user.role || "TRAVELER"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details Form Card */}
              <Card className="glass-card">
                <CardContent className="sm:px-6 px-4 sm:py-2 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="profile-name"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="profile-phone"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="profile-email"
                        disabled
                        value={user.email}
                        className="pl-10 cursor-not-allowed opacity-60"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Email cannot be changed for security reasons.</p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* ═══════════ TRAVELER PREFERENCES ═══════════ */}
          <TabsContent value="traveler" className="outline-none space-y-6 mt-0">
            <form onSubmit={handleTravelerUpdate} className="space-y-6">
              <Card className="glass-card">
                <CardContent className="sm:px-6 px-4 sm:py-2 space-y-5">
                  <SectionHeading
                    icon={Compass}
                    title="Traveler Credentials"
                    desc="Provide date of birth, nationality, and passport details for trip reservations."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-sm font-medium">
                        Date of Birth
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="dob"
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality" className="text-sm font-medium">
                        Nationality
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          placeholder="e.g. Indian, German"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passport" className="text-sm font-medium">
                      Passport Number
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="passport"
                        value={passport}
                        onChange={(e) => setPassport(e.target.value)}
                        placeholder="Enter passport number for international travels"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="sm:px-6 px-4 sm:py-2 space-y-5">
                  <SectionHeading
                    icon={PhoneCall}
                    title="Emergency Contact"
                    desc="Person to reach out to in case of emergencies during your trips."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="emergency-contact" className="text-sm font-medium">
                        Contact Person Name
                      </Label>
                      <div className="relative">
                        <UserCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="emergency-contact"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="Full name of emergency contact"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency-phone" className="text-sm font-medium">
                        Contact Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="emergency-phone"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* ═══════════ SECURITY ═══════════ */}
          <TabsContent value="security" className="outline-none space-y-6 mt-0">
            <Card className="glass-card">
              <CardContent className="sm:px-6 px-4 sm:py-2">
                <SectionHeading
                  icon={KeyRound}
                  title="Change Password"
                  desc="Update your password regularly to keep your account secure."
                />

                <form onSubmit={handlePasswordUpdate} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="curr-pass" className="text-sm font-medium">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="curr-pass"
                        required
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pl-10 pr-11"
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
                      <Label htmlFor="new-pass" className="text-sm font-medium">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-pass"
                          required
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="pr-11"
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
                      <Label htmlFor="conf-pass" className="text-sm font-medium">
                        Confirm New Password
                      </Label>
                      <Input
                        id="conf-pass"
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
  );
}
