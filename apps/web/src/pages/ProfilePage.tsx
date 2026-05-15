import {useState } from "react";
import { useNavigate } from "react-router-dom";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Bell,
  Key,
  Loader2,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { useUpdateProfile, useUserProfile, useLogout } from "@/hooks/useUser";
// import { ClayShieldIcon } from "@/components/clay-icons";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  //  Fetch user data
  const { data: user, isLoading } = useUserProfile();

  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  if (user && !isInitialized) {
    setName(user.name || "");
    setEmail(user.email || "");
    setIsInitialized(true)
  }

  const handleSaveChanges = () => {
    updateProfileMutation.mutate({ name });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Top Navigation ── */}
      <nav className="clay-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="clay-btn-ghost size-10 p-0 rounded-full flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </Button>
          <div className="flex-1 min-w-0 px-4 text-center">
            <h1 className="font-display text-xl font-bold text-foreground truncate">
              My Profile
            </h1>
          </div>
          <div className="size-10" /> {/* Spacer for symmetry */}
        </div>
      </nav>

      <main
        className="max-w-3xl mx-auto px-6 py-8 animate-clay-fade-up"
        style={{ opacity: 0 }}
      >
        {/* Profile Card */}
        <div className="clay-card-elevated p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden">
          <div
            className="absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #00C700 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="clay-avatar size-24 border-4 border-white mb-4 relative z-10">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-3xl text-primary-foreground">
                  {getInitials(user?.name || "")}
                </span>
              </div>
            )}
            {/* Edit Badge */}
            <button className="clay-card absolute bottom-0 right-0 p-1.5 rounded-full hover:scale-110 transition-transform">
              <UserIcon size={14} className="text-muted-foreground" />
            </button>
          </div>

          <h2 className="font-display text-2xl font-extrabold text-foreground z-10">
            {name}
          </h2>
          <p className="text-muted-foreground font-medium z-10">{email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
          {/* Sidebar Menu */}
          <div className="space-y-4">
            <button className="flex items-center gap-3 w-full clay-card p-4 text-left font-display font-bold text-sm bg-primary text-primary-foreground">
              <UserIcon size={18} /> Personal Info
            </button>
            <button className="flex items-center gap-3 w-full clay-btn-ghost p-4 text-left font-display font-bold text-sm text-muted-foreground hover:text-foreground">
              <Bell size={18} /> Notifications
            </button>
            <button className="flex items-center gap-3 w-full clay-btn-ghost p-4 text-left font-display font-bold text-sm text-muted-foreground hover:text-foreground">
              <Key size={18} /> Security
            </button>
            <button className="flex items-center gap-3 w-full clay-btn-ghost p-4 text-left font-display font-bold text-sm text-muted-foreground hover:text-foreground">
              <Settings size={18} /> Preferences
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            <Card className="clay-card border-0 ring-0 h-full p-0">
              <CardHeader className="pb-4 pt-6 px-8">
                <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
                  <UserIcon size={20} className="text-primary" /> Edit Details
                </CardTitle>
                <CardDescription>
                  Update your personal information below.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-2 space-y-5">
                <div className="space-y-2">
                  <Label className="font-display font-bold text-sm">
                    Full Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="clay-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display font-bold text-sm">
                    Email Address
                  </Label>
                  <Input
                    value={email}
                    // onChange={(e) => setEmail(e.target.value)}
                    className="clay-input"
                    disabled={true}
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label className="font-display font-bold text-sm">
                    Phone Number
                  </Label>
                  <Input placeholder="+91 98765 43210" className="clay-input" />
                </div> */}

                <Separator className="clay-divider my-4" />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveChanges}
                    disabled={
                      updateProfileMutation.isPending || name === user?.name
                    }
                    className={`clay-btn-primary px-8 text-sm transition-all duration-200 ${
                      updateProfileMutation.isPending || name === user?.name
                        ? "opacity-50 cursor-not-allowed grayscale-[0.5]"
                        : ""
                    }`}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </CardContent>
            </Card>

            <button
              onClick={() => logoutMutation.mutate()}
              className="w-full clay-card-elevated p-5 flex justify-center items-center gap-2 font-display font-bold text-destructive hover:scale-[1.01] transition-transform cursor-pointer"
            >
              <LogOut size={18} /> Log Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
