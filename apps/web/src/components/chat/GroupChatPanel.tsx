import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  MoreVertical,
  LogOut,
  Paperclip,
  Mic,
  Send,
  Wallet,
  Info,
  ArrowLeft,
  MessageCircle,
  Plus,
  Camera,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClayArrowRightIcon,
  ClayWalletIcon,
  ClayReceiptIcon,
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
import {
  ExpenseMessageBubble,
  ActivityBubble,
} from "@/components/chat/ExpenseMessageBubble";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useUpload } from "@/hooks/useUpload";
import { ChatImageBubble } from "@/components/chat/ChatImageBubble";

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

  // ─── Unified Feed: merge chat messages + expenses chronologically ───
  type FeedItem =
    | { type: 'chat'; data: ChatMessage; timestamp: number }
    | { type: 'expense'; data: GroupExpense; timestamp: number };

  const unifiedFeed = useMemo<FeedItem[]>(() => {
    const chatItems: FeedItem[] = messages.map((msg) => ({
      type: 'chat' as const,
      data: msg,
      timestamp: new Date(msg.createdAt).getTime(),
    }));

    const expenseItems: FeedItem[] = (group.expenses ?? []).map((exp) => ({
      type: 'expense' as const,
      data: exp,
      timestamp: new Date(exp.date).getTime(),
    }));

    return [...chatItems, ...expenseItems].sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, group.expenses]);

  const sortedActivity = useMemo(() => {
    return [...(group.activity ?? [])].reverse();
  }, [group.activity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [unifiedFeed, chatView]);

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

      {/* Messages / content area */}
      <div className="chat-messages p-4 md:p-6 overflow-y-auto flex-1">
        {chatView === "feed" && (
          <>
            {unifiedFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="clay-card p-5 rounded-full mb-4">
                  <MessageCircle size={40} className="text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-display font-bold text-lg mb-1">Start the conversation</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Send a message or add your first expense — everything shows up here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {unifiedFeed.map((item) => {
                  if (item.type === 'expense') {
                    return (
                      <ExpenseMessageBubble
                        key={`expense-${item.data.id}`}
                        expense={item.data}
                        isOwn={item.data.paidById === currentUser?.id}
                        onEdit={() => setEditingExpense(item.data)}
                        onDelete={() => setDeletingExpense(item.data)}
                        currentUserId={currentUser?.id}
                        members={group.members}
                      />
                    );
                  }

                  // Chat message
                  const msg = item.data;
                  const isOwn = msg.user.id === currentUser?.id;
                  const isImageOnly = msg.imageUrl && (!msg.content || !msg.content.trim());

                  return (
                    <div key={`chat-${msg.id}`} className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && (
                        <Avatar className="size-6 shrink-0 mb-1">
                          {msg.user.avatarUrl ? (
                            <img src={msg.user.avatarUrl} alt={msg.user.name} />
                          ) : (
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {msg.user.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] relative rounded-2xl ${isImageOnly ? "p-1" : "px-4 py-2"} ${
                        isOwn 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-white border text-foreground rounded-bl-sm"
                      }`}>
                        {!isOwn && !isImageOnly && <p className="text-[10px] font-bold text-primary mb-0.5">{msg.user.name}</p>}
                        
                        {msg.imageUrl && (
                          <div className={isImageOnly ? "" : "mb-2 -mx-2 -mt-1"}>
                            <ChatImageBubble
                              src={msg.imageUrl}
                              isOwn={isOwn}
                              senderName={msg.user.name}
                            />
                          </div>
                        )}
                        {msg.content && msg.content.trim() && (
                          <p className="text-sm break-words">{msg.content}</p>
                        )}
                        <span className={`text-[10px] block text-right mt-1 ${isImageOnly ? "absolute bottom-2 right-3 text-white drop-shadow-md z-10 font-medium" : "opacity-70"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Optimistic upload preview */}
            {uploadPreview && (
              <div className="flex items-end gap-2 justify-end">
                <div className="max-w-[75%] rounded-2xl p-1 bg-primary text-primary-foreground rounded-br-sm relative">
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={uploadPreview}
                      alt="Uploading..."
                      className="max-w-full h-auto object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span className="text-xs text-white font-medium drop-shadow-md">Uploading...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {chatView === "balances" && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="chat-info-card">
              <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                <ClayWalletIcon size={20} /> Group balances
              </h3>
              <div className="space-y-3">
                {group.balances.map((member) => (
                  <div key={member.memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">{member.name}</span>
                    </div>
                    {member.balance > 0 ? (
                      <span className="clay-stat-green text-sm font-bold">
                        +{formatCurrency(member.balance)}
                      </span>
                    ) : member.balance < 0 ? (
                      <span className="clay-stat-red text-sm font-bold">
                        −{formatCurrency(Math.abs(member.balance))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">settled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {group.settlements.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2 px-1">
                  <Wallet size={16} className="text-primary" /> Suggested payments
                </h3>
                <div className="space-y-2">
                  {group.settlements.map((settle, i) => (
                    <div key={i} className="chat-info-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-bold bg-soft-clay px-2.5 py-1 rounded-full">{settle.from}</span>
                        <ClayArrowRightIcon size={14} className="text-muted-foreground" />
                        <span className="font-bold bg-soft-clay px-2.5 py-1 rounded-full">{settle.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCurrency(settle.amount)}</span>
                        <button
                          onClick={() => setSettlingPayment(settle)}
                          className="clay-btn-secondary text-[10px] px-3 py-1.5"
                        >
                          Mark paid
                        </button>
                        <UpiPayButton
                          receiverVpa={settle.toVpa}
                          receiverName={settle.to}
                          amount={settle.amount}
                          groupName={group.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chatView === "activity" && (
          <div className="space-y-3 max-w-lg mx-auto">
            {sortedActivity.map((item) => (
              <ActivityBubble
                key={item.id}
                user={item.user}
                action={item.action}
                target={item.target}
                timestamp={formatRelativeDate(item.timestamp)}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      {chatView === "feed" && (
        <div className="chat-input-bar">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="text-primary hover:text-primary/80 p-2 rounded-full hover:bg-soft-clay transition-colors shrink-0"
            title="Add expense manually"
          >
            <Plus size={22} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && chatInput.trim()) {
                sendMessage(chatInput.trim());
                setChatInput("");
              }
            }}
            className="chat-input-field"
          />
          <div className="flex items-center gap-2 pr-1 shrink-0">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-primary bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Send image"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            </button>
            <button
              onClick={() => {
                if (chatInput.trim()) {
                  sendMessage(chatInput.trim());
                  setChatInput("");
                }
              }}
              disabled={!chatInput.trim()}
              className="chat-send-btn disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

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
          <div className="md:hidden size-9 rounded-full bg-zinc-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 bg-zinc-200 rounded w-28 animate-pulse" />
            <div className="h-3 bg-zinc-100 rounded w-20 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="size-9 rounded-full bg-zinc-100 animate-pulse" />
          <div className="size-9 rounded-full bg-zinc-100 animate-pulse" />
          <div className="size-9 rounded-full bg-zinc-100 animate-pulse" />
        </div>
      </header>

      {/* Messages List Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {[...Array(4)].map((_, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 max-w-[70%] animate-pulse ${
                isLeft ? "" : "ml-auto flex-row-reverse text-right"
              }`}
            >
              <div className="size-8 rounded-full bg-zinc-100 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-zinc-100 rounded w-16" />
                <div className={`h-16 bg-zinc-100 rounded-2xl w-48 ${isLeft ? "rounded-tl-none" : "rounded-tr-none ml-auto"}`} />
              </div>
            </div>
          );
        })}
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
