import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/apiClient";

/* ─── Types ─── */

export interface GroupMember {
  id: string;
  name: string;
  initial: string;
  color: string;
  avatarUrl?: string | null;
}

export interface GroupData {
  id: string;
  name: string;
  category: string;
  totalExpense: number;
  memberCount: number;
  members: GroupMember[];
  lastActivity: string;
  userBalance: number; // positive = owed to you, negative = you owe
  inviteCode?: string;
}

interface GroupsApiResponse {
  message: string;
  groups: GroupData[];
}

export interface ExpenseSplitDetail {
  userId: string;
  name: string;
  amount: number;
}

export interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  splitMethod: string;
  paidBy: string;
  paidById: string;
  paidByAvatar?: string | null;
  date: string;
  notes?: string | null;
  splitCount: number;
  splits: ExpenseSplitDetail[];
}

export interface GroupBalance {
  memberId: string;
  name: string;
  balance: number;
}

export interface GroupSettlement {
  from: string;
  fromId: string;
  fromVpa: string | null;
  to: string;
  toId: string;
  toVpa: string | null;
  amount: number;
}

export interface GroupActivity {
  id: string;
  type: "expense" | "settlement" | "info";
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}
export interface ContactData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface GroupDetailsData extends GroupData {
  expenses: GroupExpense[];
  balances: GroupBalance[];
  settlements: GroupSettlement[];
  activity: GroupActivity[];
}

interface CreateGroupPayload {
  name: string;
  description?: string;
  category: string;
}

/* ─── Fetch all groups for the authenticated user ─── */

async function fetchGroups(): Promise<GroupData[]> {
  const { data } = await apiClient.get<GroupsApiResponse>("/groups");
  return data.groups;
}

export function useGroups() {
  return useQuery<GroupData[]>({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    retry: 2,
  });
}

/* ─── Fetch single group details ─── */

async function fetchGroupById(id: string): Promise<GroupDetailsData> {
  const { data } = await apiClient.get<{
    message: string;
    group: GroupDetailsData;
  }>(`/groups/${id}`);
  return data.group;
}

export function useGroup(id: string | undefined) {
  return useQuery<GroupDetailsData>({
    queryKey: ["group", id],
    queryFn: () => fetchGroupById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
}

/* ─── Create a new group ─── */

async function createGroup(payload: CreateGroupPayload) {
  const { data } = await apiClient.post("/groups", payload);
  return data;
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      // Invalidate the groups query to refetch the list after creation
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/* ─── Join a group ─── */

async function joinGroup(inviteCode: string) {
  const { data } = await apiClient.post("/groups/join", { inviteCode });
  return data;
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      // Invalidate to fetch the newly joined group
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/* ─── Fetch Group Contacts ─── */

async function fetchGroupContacts(groupId: string): Promise<ContactData[]> {
  const { data } = await apiClient.get<{ message: string; contacts: ContactData[] }>(`/groups/${groupId}/contacts`);
  return data.contacts;
}

export function useGroupContacts(groupId: string | undefined) {
  return useQuery<ContactData[]>({
    queryKey: ["groupContacts", groupId],
    queryFn: () => fetchGroupContacts(groupId!),
    enabled: !!groupId,
  });
}

/* ─── Add Member Directly ─── */

async function addMemberDirectly({ groupId, userId }: { groupId: string; userId: string }) {
  const { data } = await apiClient.post(`/groups/${groupId}/members`, { userId });
  return data;
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMemberDirectly,
    onSuccess: (_, variables) => {
      // Refetch the group details and contacts after adding a member
      queryClient.invalidateQueries({ queryKey: ["group", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupContacts", variables.groupId] });
    },
  });
}

/* ─── Add Member By Email ─── */

async function addMemberByEmail({ groupId, email }: { groupId: string; email: string }) {
  const { data } = await apiClient.post(`/groups/${groupId}/members/email`, { email });
  return data;
}

export function useAddMemberByEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMemberByEmail,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupContacts", variables.groupId] });
    },
  });
}

/* ─── Leave Group ─── */

async function leaveGroup(groupId: string) {
  const { data } = await apiClient.post(`/groups/${groupId}/leave`);
  return data;
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/* ─── Mark as Paid (Manual Settlement) ─── */

interface MarkAsPaidPayload {
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number; // In paise/cents (smallest currency unit)
  note?: string;
}

async function markAsPaid({ groupId, ...body }: MarkAsPaidPayload) {
  const { data } = await apiClient.post(`/groups/${groupId}/settlements`, body);
  return data;
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsPaid,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

