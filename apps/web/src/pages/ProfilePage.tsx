import { useState } from "react";
import { VPA_REGEX } from "@settleup/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AtSign,
  CheckCircle2,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useUpdateProfile, useUserProfile, useLogout } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [vpa, setVpa] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: user, isLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  if (user && !isInitialized) {
    setName(user.name || "");
    setEmail(user.email || "");
    setVpa(user.vpa || "");
    setIsInitialized(true);
  }

  const isVpaValid = vpa.length === 0 || VPA_REGEX.test(vpa);

  const handleSaveChanges = () => {
    updateProfileMutation.mutate({
      name,
      ...(vpa && isVpaValid ? { vpa } : {}),
    });
  };

  const getInitials = (fullname: string) => {
    if (!fullname) return "UK";
    return fullname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="chat-main-panel overflow-hidden">
        <header className="chat-header">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-6">
          {/* Avatar card skeleton */}
          <div className="chat-info-card p-8 mb-6 flex flex-col items-center space-y-4">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Form card skeleton */}
            <div className="chat-info-card p-6 space-y-6">
              <Skeleton className="h-6 w-1/4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-10 rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main-panel overflow-y-auto">
      <header className="chat-header">
        <div>
          <h1 className="font-display text-lg font-extrabold">My profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your account settings
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-clay-fade-up">
        {/* Profile card */}
        <div className="chat-info-card p-8 mb-6 flex flex-col items-center text-center relative overflow-hidden">
          <div
            className="absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #00C700 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div className="clay-avatar size-24 border-4 border-white mb-4 relative z-10">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={name}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-3xl text-primary-foreground">
                  {getInitials(user?.name || "")}
                </span>
              </div>
            )}
          </div>
          <h2 className="font-display text-2xl font-extrabold z-10">{name}</h2>
          <p className="text-muted-foreground font-medium z-10">{email}</p>
          {user?.vpa && (
            <p className="text-sm text-primary font-medium z-10 flex items-center gap-1 mt-1">
              <AtSign size={14} />
              {user.vpa}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="chat-info-card border-0 ring-0 p-0 shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
                <UserIcon size={20} className="text-primary" /> Edit details
              </CardTitle>
              <CardDescription>
                Update your personal information below.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              <div className="space-y-2">
                <Label className="font-display font-bold text-sm">Full name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="clay-input" />
              </div>
              <div className="space-y-2">
                <Label className="font-display font-bold text-sm">Email address</Label>
                <Input value={email} className="clay-input" disabled />
              </div>
              <div className="space-y-2">
                <Label className="font-display font-bold text-sm flex items-center gap-2">
                  UPI ID (VPA)
                  {vpa && isVpaValid && (
                    <span className="clay-badge clay-badge-green text-[10px] px-2 py-0 flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Valid
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value.trim())}
                    placeholder="yourname@upi"
                    className={`clay-input pl-11 ${
                      vpa && !isVpaValid
                        ? "ring-2 ring-red-500/30"
                        : vpa && isVpaValid
                          ? "ring-2 ring-green-500/30"
                          : ""
                    }`}
                  />
                </div>
                {vpa && !isVpaValid && (
                  <p className="text-xs text-red-500 font-medium">
                    Enter a valid UPI ID (e.g. name@okaxis)
                  </p>
                )}
              </div>

              <Separator className="clay-divider my-4" />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  disabled={Boolean(
                    updateProfileMutation.isPending ||
                      (name === user?.name && vpa === (user?.vpa || "")) ||
                      (vpa && !isVpaValid),
                  )}
                  className={`clay-btn-primary px-8 text-sm ${
                    updateProfileMutation.isPending ||
                    (name === user?.name && vpa === (user?.vpa || "")) ||
                    (vpa && !isVpaValid)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <button
          onClick={() => logoutMutation.mutate()}
          className="w-full chat-info-card mt-6 p-5 flex justify-center items-center gap-2 font-display font-bold text-destructive hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </div>
  );
}
