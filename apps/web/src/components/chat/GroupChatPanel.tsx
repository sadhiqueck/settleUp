import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  MoreVertical,
  LogOut,
  Send,
  Wallet,
  Info,
  ArrowLeft,
  MessageCircle,
  Plus,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClayWalletIcon,
} from "@/components/clay-icons";
import type { GroupDetailsData, GroupExpense, GroupSettlement } from "@/hooks/useGroups";
import { useLeaveGroup } from "@/hooks/useGroups";
import { useUserProfile } from "@/hooks/useUser";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";
import { AddExpenseModal } from "@/components/groups/AddExpenseModal";
import { EditExpenseModal } from "@/components/groups/EditExpenseModal";
import { DeleteExpenseDialog } from "@/components/groups/DeleteExpenseDialog";
import { UpiPayButton } from "@/components/groups/UpiPayButton";
import { MarkAsPaidDialog } from "@/components/groups/MarkAsPaidDialog";
import { useUpload } from "@/hooks/useUpload";
import { ChatFeed } from "./ChatFeed";
import { ChatBalances } from "./ChatBalances";
import { ChatActivity } from "./ChatActivity";
import { Skeleton } from "@/components/ui/skeleton";

type ChatView = "feed" | "balances" | "activity";

interface GroupChatPanelProps {
  group: GroupDetailsData;
}




export function GroupChatPanel({ group }: GroupChatPanelProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatView, setChatView] = useState<ChatView>("feed");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<GroupExpense | null>(null);
  const [settlingPayment, setSettlingPayment] = useState<GroupSettlement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const { data: currentUser } = useUserProfile();
  const leaveGroupMutation = useLeaveGroup();
  
  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload();

  // Real-time chat integration
  const { messages, sendMessage } = useChat(group.id);

  // Optimistic preview: show a local preview immediately while uploading
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview URL immediately
    const localPreview = URL.createObjectURL(file);
    setUploadPreview(localPreview);
    
    try {
      const fileUrl = await uploadFile(file);
      sendMessage("", fileUrl);
      toast.success("Image sent");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadPreview(null);
      URL.revokeObjectURL(localPreview);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // We moved sorting logic down to the children (ChatFeed and ChatActivity)

  const onlineCount = Math.max(1, Math.floor(group.memberCount * 0.4));

  const handleLeaveGroup = () => {
    if (
      window.confirm(
        "Leave this group? Make sure your balance is settled first.",
      )
    ) {
      leaveGroupMutation.mutate(group.id, {
        onSuccess: () => navigate("/dashboard"),
        onError: (error: Error) => {
          const err = error as AxiosError<{ message: string }>;
          toast.error(err.response?.data?.message || "Failed to leave group");
        },
      });
    }
  };

  return (
    <div className="chat-main-panel">
      {/* Header */}
      <header className="chat-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="md:hidden size-9 rounded-full flex items-center justify-center hover:bg-soft-clay transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-lg font-extrabold text-foreground">
              {group.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {group.memberCount} members · {onlineCount} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full size-9 text-muted-foreground">
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full size-9 text-muted-foreground">
            <Phone size={18} />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-9 text-muted-foreground"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 clay-card py-1 min-w-[160px] animate-clay-scale-in">
                  <button
                    onClick={() => { setIsInviteModalOpen(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-soft-clay font-medium"
                  >
                    Invite members
                  </button>
                  <button
                    onClick={() => { handleLeaveGroup(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-rose-500 font-medium flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Leave group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* View tabs */}
      <div className="shrink-0 flex gap-1 px-6 py-2 border-b border-border/20 bg-[#fafbfc]">
        {(
          [
            { id: "feed" as const, label: "Feed", icon: MessageCircle },
            { id: "balances" as const, label: "Balances", icon: ClayWalletIcon },
            { id: "activity" as const, label: "Activity", icon: Info },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setChatView(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
              chatView === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="chat-messages p-0 md:p-0 overflow-hidden flex flex-col flex-1">
        {chatView === "feed" && (
          <ChatFeed
            group={group}
            currentUser={currentUser}
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendMessage={sendMessage}
            isUploading={isUploading}
            uploadPreview={uploadPreview}
            handleImageUpload={handleImageUpload}
            fileInputRef={fileInputRef}
            setIsAddExpenseOpen={setIsAddExpenseOpen}
            setEditingExpense={setEditingExpense}
            setDeletingExpense={setDeletingExpense}
          />
        )}

        {chatView === "balances" && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            <ChatBalances group={group} onSettlePayment={setSettlingPayment} />
          </div>
        )}

        {chatView === "activity" && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            <ChatActivity group={group} />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal
        key={isAddExpenseOpen ? "open" : "closed"}
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={group.id}
        groupName={group.name}
        members={group.members}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        groupId={group.id}
        groupName={group.name}
        inviteCode={group.inviteCode}
      />
      {editingExpense && (
        <EditExpenseModal
          isOpen
          onClose={() => setEditingExpense(null)}
          groupId={group.id}
          expense={editingExpense}
        />
      )}
      {deletingExpense && (
        <DeleteExpenseDialog
          isOpen
          onClose={() => setDeletingExpense(null)}
          groupId={group.id}
          expenseId={deletingExpense.id}
          expenseTitle={deletingExpense.title}
          expenseAmount={deletingExpense.amount}
        />
      )}
      {settlingPayment && (
        <MarkAsPaidDialog
          isOpen
          onClose={() => setSettlingPayment(null)}
          groupId={group.id}
          fromName={settlingPayment.from}
          fromId={settlingPayment.fromId}
          toName={settlingPayment.to}
          toId={settlingPayment.toId}
          amount={settlingPayment.amount}
        />
      )}
    </div>
  );
}

export function GroupChatLoading() {
  return (
    <div className="chat-main-panel overflow-hidden">
      {/* Header Skeleton */}
      <header className="chat-header flex items-center justify-between border-b border-border/10">
        <div className="flex items-center gap-3">
          <Skeleton className="md:hidden size-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </header>

      {/* Messages List Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {[...Array(4)].map((_, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                isLeft ? "justify-start" : "justify-end"
              }`}
            >
              {isLeft && (
                <Skeleton className="size-8 rounded-full mb-1 shrink-0" />
              )}
              <div
                className={`flex flex-col gap-1 max-w-[70%] ${
                  isLeft ? "items-start" : "items-end"
                }`}
              >
                {isLeft && <Skeleton className="h-3 w-16 mb-1" />}
                <Skeleton className={`h-16 ${i % 3 === 0 ? "w-64" : "w-48"} rounded-2xl`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar skeleton */}
      <div className="chat-input-bar">
        <Skeleton className="size-10 rounded-full shrink-0" />
        <Skeleton className="flex-1 h-10 rounded-full" />
        <div className="flex gap-2 shrink-0">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GroupChatEmpty() {
  return (
    <div className="chat-main-panel flex flex-col items-center justify-center text-center px-8">
      <div
        className="size-24 rounded-3xl flex items-center justify-center mb-6 font-display font-extrabold text-3xl text-white"
        style={{
          background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
          boxShadow: "0 8px 32px rgba(0, 199, 0, 0.3)",
        }}
      >
        SU
      </div>
      <h2 className="font-display text-2xl font-extrabold text-foreground mb-2">
        Settle<span className="text-emerald-500">Up</span>
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Select a group from the sidebar to view expenses, balances, and settlements — all in one conversation-style feed.
      </p>
    </div>
  );
}
