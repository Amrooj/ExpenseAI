import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CURRENCIES, TIMEZONES } from "@/lib/utils";
import { User, Lock, MonitorSmartphone, Loader2 } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  defaultCurrency: z.string().length(3),
  timezone: z.string().min(1),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, updateProfile, changePassword, logoutAll, isLoading } = useAuthStore();
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue: setProfileValue, watch: watchProfile, formState: { errors: profileErrors, isDirty: isProfileDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      defaultCurrency: user?.defaultCurrency || "USD",
      timezone: user?.timezone || "UTC",
    },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const currencyVal = watchProfile("defaultCurrency");
  const tzVal = watchProfile("timezone");

  const onProfileSubmit = async (data: ProfileFormData) => {
    await updateProfile(data);
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
    resetPassword();
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    await logoutAll();
    setIsLoggingOutAll(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-dark-muted mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-400" />
              Profile Preferences
            </CardTitle>
            <CardDescription>Update your personal information and local settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  {...registerProfile("name")}
                  label="Full Name"
                  placeholder="John Doe"
                  error={profileErrors.name?.message}
                  disabled={isLoading}
                />
                <Input
                  label="Email Address"
                  value={user?.email || ""}
                  disabled
                  helperText="Email cannot be changed."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Default Currency</label>
                  <Select
                    value={currencyVal}
                    onValueChange={(val) => setProfileValue("defaultCurrency", val, { shouldDirty: true })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} - {c.name} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profileErrors.defaultCurrency && (
                    <p className="text-xs text-danger-400">Invalid currency</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Timezone</label>
                  <Select
                    value={tzVal}
                    onValueChange={(val) => setProfileValue("timezone", val, { shouldDirty: true })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profileErrors.timezone && (
                    <p className="text-xs text-danger-400">Invalid timezone</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!isProfileDirty || isLoading} className="min-w-[120px]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-violet-400" />
              Security
            </CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <Input
                {...registerPassword("currentPassword")}
                type="password"
                label="Current Password"
                error={passwordErrors.currentPassword?.message}
                disabled={isLoading}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  {...registerPassword("newPassword")}
                  type="password"
                  label="New Password"
                  error={passwordErrors.newPassword?.message}
                  disabled={isLoading}
                />
                <Input
                  {...registerPassword("confirmPassword")}
                  type="password"
                  label="Confirm New Password"
                  error={passwordErrors.confirmPassword?.message}
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Device Management */}
        <Card className="border-danger-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger-400">
              <MonitorSmartphone className="w-5 h-5" />
              Device Management
            </CardTitle>
            <CardDescription>
              Log out of all other devices if you notice suspicious activity or lost a device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-6" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Sign out everywhere</p>
                <p className="text-sm text-dark-muted mt-1">
                  This will invalidate all current sessions across all devices.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                className="shrink-0"
              >
                {isLoggingOutAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign out all devices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
