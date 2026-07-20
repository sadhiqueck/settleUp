import { useState, useRef } from "react";
import { useUserProfile, useUpdateProfile } from "@/shared/hooks/useUser";
import { useUpload } from "@/shared/hooks/useUpload";
import { VPA_REGEX } from "@fettl/shared";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, AtSign, Camera, ChevronRight, User as UserIcon } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

// Notion-style default avatars
const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Felix",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Jasper",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Mia",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Leo",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Zoe",
];

export default function OnboardingPage() {
  const { data: user } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const navigate = useNavigate();
  const { uploadFile, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || PREDEFINED_AVATARS[0]);

  // Step 2 State
  const [vpa, setVpa] = useState(user?.vpa || "");
  const [vpaTouched, setVpaTouched] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      // Show optimistic preview while uploading
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      
      const uploadedUrl = await uploadFile(file);
      setAvatarUrl(uploadedUrl);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
      // Revert on error
      setAvatarUrl(user?.avatarUrl || PREDEFINED_AVATARS[0]);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValidVpa = vpa.trim() === "" || VPA_REGEX.test(vpa);
    
    if (!isValidVpa) {
      toast.error("Please enter a valid UPI ID or leave it blank");
      return;
    }

    updateProfileMutation.mutate(
      {
        name,
        avatarUrl,
        ...(vpa.trim() ? { vpa: vpa.trim() } : {}),
        isOnboarded: true,
      },
      {
        onSuccess: () => {
          toast.success("Welcome to Fettl!");
          navigate("/dashboard");
        },
        onError: () => {
          toast.error("Failed to save profile. Please try again.");
        }
      }
    );
  };

  const isVpaValid = vpa.trim() === "" || VPA_REGEX.test(vpa);
  const showVpaError = vpaTouched && vpa.length > 0 && !isVpaValid;
  const showVpaSuccess = vpa.length > 0 && isVpaValid;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background glows removed as requested */}

      <div className="w-full max-w-md relative z-10">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8 px-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <div className="app-card-elevated p-6 md:p-8 rounded-3xl border-0 ring-0">
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold mb-2">Complete your profile</h1>
                <p className="text-muted-foreground text-sm">How should we identify you in groups?</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Avatar Selection */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="size-24 ring-4 ring-background shadow-xl">
                      <AvatarImage src={avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-muted text-2xl">
                        {name ? name.charAt(0).toUpperCase() : <UserIcon size={32} />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Camera size={14} />}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="w-full">
                    <p className="text-xs text-muted-foreground font-medium mb-3 text-center uppercase tracking-wider">
                      Or pick an avatar
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {PREDEFINED_AVATARS.map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`size-12 rounded-full overflow-hidden transition-all duration-200 ${
                            avatarUrl === url 
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' 
                              : 'hover:scale-110 ring-1 ring-border opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="preset avatar" className="w-full h-full object-cover bg-muted/30" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="font-display font-bold text-sm">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="clay-input"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || isUploading}
                  className="clay-btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                  <AtSign size={24} />
                </div>
                <h1 className="text-2xl font-display font-bold mb-2">Set up payments</h1>
                <p className="text-muted-foreground text-sm">Add your UPI ID to receive money from friends</p>
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vpa" className="font-display font-bold text-sm">UPI ID (VPA)</Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="vpa"
                      value={vpa}
                      onChange={(e) => {
                        setVpa(e.target.value.trim());
                        if (!vpaTouched) setVpaTouched(true);
                      }}
                      onBlur={() => setVpaTouched(true)}
                      placeholder="yourname@upi"
                      className={`clay-input pl-11 pr-11 ${
                        showVpaError ? "ring-2 ring-red-500/30 border-red-500/50" : 
                        showVpaSuccess ? "ring-2 ring-green-500/30 border-green-500/50" : ""
                      }`}
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {showVpaSuccess && <CheckCircle2 size={18} className="text-green-500" />}
                      {showVpaError && <AlertCircle size={18} className="text-red-500" />}
                    </div>
                  </div>
                  
                  {showVpaError && (
                    <p className="text-xs text-red-500 font-medium">Enter a valid UPI ID (e.g. name@okaxis)</p>
                  )}
                  {showVpaSuccess && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Valid format
                    </p>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-base">💡</div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This helps group members pay you directly when they settle up. You can always add or change this later in settings.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={(!isVpaValid && vpa.length > 0) || updateProfileMutation.isPending}
                    className="clay-btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <><Loader2 className="animate-spin" size={18} /> Finishing...</>
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-muted-foreground hover:text-foreground py-2 font-medium"
                    disabled={updateProfileMutation.isPending}
                  >
                    Back to Profile
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
