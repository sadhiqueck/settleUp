import { useMemo } from "react";
import type { GroupDetailsData } from "@/hooks/useGroups";
import { ActivityBubble } from "@/components/chat/ExpenseMessageBubble";
import { formatRelativeDate } from "@/lib/format";

interface ChatActivityProps {
  group: GroupDetailsData;
}

export function ChatActivity({ group }: ChatActivityProps) {
  const sortedActivity = useMemo(() => {
    return [...(group.activity ?? [])].reverse();
  }, [group.activity]);

  return (
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
  );
}
