  import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/context/SocketContext';

// Define the shape of our message
export interface ChatMessage {
  id: string;
  groupId: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export function useChat(groupId: string) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // 1. Join the room when the component mounts
    socket.emit('joinGroup', { groupId });

    // 2. Listen for incoming chat messages
    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleHistory = (payload: { history: ChatMessage[]; hasMore: boolean } | ChatMessage[]) => {
      if (Array.isArray(payload)) {
        setMessages(payload);
        setHasMore(false);
      } else {
        setMessages(payload.history || []);
        setHasMore(payload.hasMore || false);
      }
    };

    const handleOlderMessages = (payload: { history: ChatMessage[]; hasMore: boolean }) => {
      setMessages((prev) => [...(payload.history || []), ...prev]);
      setHasMore(payload.hasMore || false);
    };

    // 3. Listen for real-time expense/settlement broadcasts
    //    When the server tells us an expense was created/updated/deleted,
    //    we invalidate the React Query cache so the group data re-fetches.
    const handleExpenseChange = (data: { groupId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['group', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('chatHistory', handleHistory);
    socket.on('olderMessages', handleOlderMessages);
    socket.on('expense:created', handleExpenseChange);
    socket.on('expense:updated', handleExpenseChange);
    socket.on('expense:deleted', handleExpenseChange);
    socket.on('settlement:created', handleExpenseChange);

    // 4. Cleanup: Leave room and remove all listeners
    return () => {
      socket.emit('leaveGroup', { groupId });
      socket.off('newMessage', handleNewMessage);
      socket.off('chatHistory', handleHistory);
      socket.off('olderMessages', handleOlderMessages);
      socket.off('expense:created', handleExpenseChange);
      socket.off('expense:updated', handleExpenseChange);
      socket.off('expense:deleted', handleExpenseChange);
      socket.off('settlement:created', handleExpenseChange);
    };
  }, [socket, isConnected, groupId, queryClient]);

  // Expose a simple function to send messages
  const sendMessage = useCallback((content: string, imageUrl?: string) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { groupId, content, imageUrl });
    }
  }, [socket, isConnected, groupId]);

  const loadMore = useCallback(() => {
    if (socket && isConnected && messages.length > 0 && hasMore) {
      socket.emit('loadMoreMessages', { groupId, cursor: messages[0].id });
    }
  }, [socket, isConnected, groupId, messages, hasMore]);

  return {
    messages,
    hasMore,
    loadMore,
    sendMessage,
    setMessages,
  };
}
