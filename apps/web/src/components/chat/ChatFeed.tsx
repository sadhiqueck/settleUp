import { useMemo, useRef, useEffect } from "react";
import { MessageCircle, ImageIcon, Loader2, Plus, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GroupDetailsData, GroupExpense } from "@/hooks/useGroups";
import { ExpenseMessageBubble } from "@/components/chat/ExpenseMessageBubble";
import { ChatImageBubble } from "@/components/chat/ChatImageBubble";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatFeedProps {
  group: GroupDetailsData;
  currentUser: { id: string } | undefined;
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (input: string) => void;
  sendMessage: (content: string, imageUrl?: string) => void;
  isUploading: boolean;
  uploadPreview: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  setIsAddExpenseOpen: (isOpen: boolean) => void;
  setEditingExpense: (expense: GroupExpense) => void;
  setDeletingExpense: (expense: GroupExpense) => void;
}

type FeedItem =
  | { type: "chat"; data: ChatMessage; timestamp: number }
  | { type: "expense"; data: GroupExpense; timestamp: number };

export function ChatFeed({
  group,
  currentUser,
  messages,
  chatInput,
  setChatInput,
  sendMessage,
  isUploading,
  uploadPreview,
  handleImageUpload,
  fileInputRef,
  setIsAddExpenseOpen,
  setEditingExpense,
  setDeletingExpense,
}: ChatFeedProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unifiedFeed = useMemo<FeedItem[]>(() => {
    const chatItems: FeedItem[] = messages.map((msg) => ({
      type: "chat" as const,
      data: msg,
      timestamp: new Date(msg.createdAt).getTime(),
    }));

    const expenseItems: FeedItem[] = (group.expenses ?? []).map((exp) => ({
      type: "expense" as const,
      data: exp,
      timestamp: new Date(exp.date).getTime(),
    }));

    return [...chatItems, ...expenseItems].sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, group.expenses]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [unifiedFeed]);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
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
              if (item.type === "expense") {
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

        {uploadPreview && (
          <div className="flex items-end gap-2 justify-end mt-4">
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
        <div ref={messagesEndRef} />
      </div>

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
    </>
  );
}
