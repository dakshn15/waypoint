"use client";

import { useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { updateTravelerProfile } from "@/app/actions/profile";
import { User, Shield, Compass, Lock } from "lucide-react";

interface ProfileTabsClientProps {
  user: any;
  initialProfile: any;
}

export default function ProfileTabsClient({ user, initialProfile }: ProfileTabsClientProps) {
  const router = useRouter();
  // Account settings state
  const [name, setName] = useState(user.name || "");
  const [imageUrl, setImageUrl] = useState(user.image || "");
  const [updatingAccount, setUpdatingAccount] = useState(false);

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
  const [updatingTraveler, setUpdatingTraveler] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Handle file selection and conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setImageUrl(reader.result);
        toast.success("Image preview updated! Click 'Save Details' to save permanently.");
      }
    };
    reader.onerror = () => {
      toast.error("Error reading image file.");
    };
    reader.readAsDataURL(file);
  };

  // Handle Account Update
  async function handleAccountUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setUpdatingAccount(true);
    try {
      const { data, error } = await authClient.updateUser({
        name,
        image: imageUrl || undefined,
      });

      if (error) {
        toast.error(error.message || "Failed to update profile details");
      } else {
        toast.success("Profile details updated successfully!");
        router.refresh();
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setUpdatingAccount(false);
    }
  }

  // Handle Traveler Profile Update
  async function handleTravelerUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdatingTraveler(true);
    try {
      await updateTravelerProfile({
        dateOfBirth: dob ? new Date(dob) : null,
        nationality: nationality || null,
        passportNumber: passport || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
      });
      toast.success("Traveler profile and preferences saved!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update traveler preferences.");
    } finally {
      setUpdatingTraveler(false);
    }
  }

  // Handle Password Update
  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { data, error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });


      if (error) {
        toast.error(error.message || "Failed to change password. Double check current password.");
      } else {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error("Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <Tabs defaultValue="account" className="w-full space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="account" className="flex items-center gap-1.5 py-2">
          <User className="h-3.5 w-3.5" />
          Account
        </TabsTrigger>
        <TabsTrigger value="traveler" className="flex items-center gap-1.5 py-2">
          <Compass className="h-3.5 w-3.5" />
          Traveler
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-1.5 py-2">
          <Lock className="h-3.5 w-3.5" />
          Security
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Account Details */}
      <TabsContent value="account">
        <Card className="glass-card border border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Update your profile picture, display name, and key credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccountUpdate} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                  {imageUrl ? (
                    <AvatarImage src={imageUrl} alt={name} />
                  ) : null}
                  <AvatarFallback className="bg-[var(--waypoint-navy)] text-white text-2xl font-semibold">
                    {name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-md font-semibold">{name || "User Profile"}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      Upload New Photo
                    </Button>
                    {imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8"
                        onClick={() => setImageUrl("")}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-zinc-100/50 dark:bg-zinc-900/50 text-muted-foreground border-zinc-200/50"
                  />
                </div>

              </div>

              <Button
                type="submit"
                disabled={updatingAccount}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white px-6 rounded-lg transition-colors font-medium text-xs h-9"
              >
                {updatingAccount ? "Saving Changes..." : "Save Details"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 2: Traveler details */}
      <TabsContent value="traveler">
        <Card className="glass-card border border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Traveler Profile & Preferences</CardTitle>
            <CardDescription>
              Provide passport credentials and emergency contact info to streamline bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTravelerUpdate} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                    placeholder="Indian, German, etc."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="passport">Passport Number</Label>
                  <Input
                    id="passport"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                    placeholder="Enter passport number"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3">Emergency Contact Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                      placeholder="Emergency contact full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Contact Phone Number</Label>
                    <Input
                      id="emergencyPhone"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={updatingTraveler}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white px-6 rounded-lg transition-colors font-medium text-xs h-9"
              >
                {updatingTraveler ? "Saving Preferences..." : "Save Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 3: Security Settings */}
      <TabsContent value="security">
        <Card className="glass-card border border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Revoke other active sessions and reset your password credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/50 dark:bg-black/50 focus-visible:ring-[var(--waypoint-teal)]"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={updatingPassword}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white px-6 rounded-lg transition-colors font-medium text-xs h-9"
              >
                {updatingPassword ? "Changing Password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
