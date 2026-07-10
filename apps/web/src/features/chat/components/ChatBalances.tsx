import { Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ClayArrowRightIcon, ClayWalletIcon } from "@/shared/components/ui/clay-icons";
import { formatCurrency } from "@/shared/lib/format";
import type { GroupDetailsData, GroupSettlement } from "@/features/groups/hooks/useGroups";
import { UpiPayButton } from "@/features/groups/components/UpiPayButton";

interface ChatBalancesProps {
  group: GroupDetailsData;
  onSettlePayment: (settle: GroupSettlement) => void;
}

export function ChatBalances({ group, onSettlePayment }: ChatBalancesProps) {
  return (
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
                    onClick={() => onSettlePayment(settle)}
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
  );
}
