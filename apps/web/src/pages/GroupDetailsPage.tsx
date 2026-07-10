import { useParams } from "react-router-dom";
import { useGroup } from "@/features/groups/hooks/useGroups";
import {
  GroupChatPanel,
  GroupChatLoading,
} from "@/features/chat/components/GroupChatPanel";

export default function GroupDetailsPage() {
  const { id } = useParams();
  const { data: group, isLoading, error } = useGroup(id);

  if (isLoading) return <GroupChatLoading />;

  if (error || !group) {
    return (
      <div className="chat-main-panel flex items-center justify-center">
        <p className="text-muted-foreground">
          {error?.message || "Group not found"}
        </p>
      </div>
    );
  }

  return <GroupChatPanel group={group} />;
}
