import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Input } from "@/shared/components/ui/input";
import {
  Users as ClayGroupIcon,
  Check as ClayCheckIcon,
  Copy,
  Share2,
  Loader2,
  Plus,
  Mail,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGroupContacts,
  useAddMember,
  useAddMemberByEmail,
} from "@/features/groups/hooks/useGroups";
import { apiClient } from "@/shared/lib/apiClient";
import type { AxiosError } from "axios";

interface InviteMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  inviteCode?: string;
}

interface PreviewUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export function InviteMemberModal({
  isOpen,
  onOpenChange,
  groupId,
  groupName,
  inviteCode,
}: InviteMemberModalProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);

  const { data: contacts, isLoading: contactsLoading } =
    useGroupContacts(groupId);
  const addMemberMutation = useAddMember();
  const addMemberByEmailMutation = useAddMemberByEmail();

  // Reset states when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setPreviewUser(null);
    }
    onOpenChange(open);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await apiClient.get<PreviewUser[]>(
        `/users/search?q=${encodeURIComponent(email)}`,
      );

      const exactMatch = data.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (exactMatch) {
        setPreviewUser(exactMatch);
      } else {
        toast.error("No user found with this registered email.");
      }
    } catch {
      toast.error("Failed to search for user. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!previewUser) return;

    const toastId = toast.loading("Adding user to group...");

    addMemberByEmailMutation.mutate(
      { groupId, email: previewUser.email },
      {
        onSuccess: () => {
          toast.success(`${previewUser.name} added to the group!`, {
            id: toastId,
          });
          setEmail("");
          setPreviewUser(null);
        },
        onError: (error: Error) => {
          const err = error as AxiosError<{ message: string }>;
          toast.error(err.response?.data?.message || "Failed to add user", {
            id: toastId,
          });
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-sm text-center flex flex-col items-center p-8">
        <div className="clay-card p-4 mb-4 bg-soft-clay rounded-full">
          <ClayGroupIcon size={32} className="text-primary" />
        </div>
        <DialogTitle className="font-display text-xl font-bold mb-2">
          Invite Members
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mb-6">
          Share this code with your friends so they can join {groupName}.
        </DialogDescription>

        <div className="w-full bg-soft-clay p-4 rounded-2xl flex items-center justify-between mb-6 shadow-inner">
          <span className="font-mono text-xl font-bold tracking-widest text-foreground select-all">
            {inviteCode || "No Code"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="clay-btn-ghost size-10 rounded-xl"
            onClick={() => {
              if (inviteCode) {
                navigator.clipboard.writeText(inviteCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
          >
            {copied ? (
              <ClayCheckIcon size={18} className="text-green-500" />
            ) : (
              <Copy size={18} />
            )}
          </Button>
        </div>

        <Button
          className="clay-btn-primary w-full py-6 text-sm font-display flex items-center gap-2 justify-center shadow-lg"
          onClick={async () => {
            if (navigator.share && inviteCode) {
              try {
                await navigator.share({
                  title: `Join ${groupName} on SettleUp`,
                  text: `Hey! Join my group on SettleUp to split expenses easily. Use this invite link: ${import.meta.env.VITE_BASE_URL}/groups/join/${inviteCode}`,
                });
              } catch (error) {
                console.error("Error sharing", error);
              }
            } else if (inviteCode) {
              navigator.clipboard.writeText(
                `${import.meta.env.VITE_FRONTEND_URL}/groups/join/${inviteCode}`,
              );
              setCopied(true);
              toast.success("Invite link copied to clipboard!");
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          <Share2 size={18} />
          Share Invite Code
        </Button>

        {previewUser ? (
          <div className="w-full mt-6 p-4 bg-soft-clay rounded-2xl border border-border/50 animate-clay-fade-up shadow-inner">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
              Confirm Member
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border-2 border-background">
                  {previewUser.avatarUrl && (
                    <AvatarImage
                      src={previewUser.avatarUrl}
                      alt={previewUser.name}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {previewUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold truncate max-w-37.5">
                    {previewUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-37.5">
                    {previewUser.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  onClick={() => setPreviewUser(null)}
                  disabled={addMemberByEmailMutation.isPending}
                >
                  <X className="size-4" />
                </Button>
                <Button
                  size="icon"
                  className="size-8 rounded-full clay-btn-primary"
                  onClick={handleConfirmAdd}
                  disabled={addMemberByEmailMutation.isPending}
                >
                  {addMemberByEmailMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full mt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                name="email"
                type="email"
                placeholder="Add by email address..."
                className="clay-input flex-1 h-12 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSearching}
              />
              <Button
                type="submit"
                className="clay-btn-secondary h-12 px-4 rounded-xl flex items-center gap-2 transition-all"
                disabled={isSearching || !email}
              >
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                <span className="font-display font-semibold text-sm">Find</span>
              </Button>
            </form>
          </div>
        )}

        {/* Add Friends Section */}
        <div className="w-full mt-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Or Add Friends
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {contactsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 text-left">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-soft-clay transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {contact.avatarUrl && (
                        <AvatarImage
                          src={contact.avatarUrl}
                          alt={contact.name}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate max-w-30">
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-30">
                        {contact.email}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    onClick={() => {
                      const toastId = toast.loading(
                        `Adding ${contact.name}...`,
                      );
                      addMemberMutation.mutate(
                        {
                          groupId,
                          userId: contact.id,
                        },
                        {
                          onSuccess: () =>
                            toast.success(`${contact.name} added!`, {
                              id: toastId,
                            }),
                          onError: (error: Error) => {
                            const err = error as AxiosError<{
                              message: string;
                            }>;
                            toast.error(
                              err.response?.data?.message ||
                                "Failed to add user",
                              { id: toastId },
                            );
                          },
                        },
                      );
                    }}
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending &&
                    addMemberMutation.variables?.userId === contact.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground p-2">
              No recent contacts found to add directly.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
