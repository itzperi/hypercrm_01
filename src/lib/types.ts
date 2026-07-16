export type UserRole =
  | "ceo_admin"
  | "cto_admin"
  | "sales_employee"
  | "tech_employee"
  | "client";

export type LeadStage =
  | "lead"
  | "contacted"
  | "meeting_booked"
  | "proposal_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type ClientStage =
  | "lead"
  | "proposal"
  | "signed"
  | "onboarded"
  | "active"
  | "churned";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type ProjectHealth = "on_track" | "at_risk" | "delayed";
export type ContentStatus = "idea" | "draft" | "review" | "scheduled" | "published";
export type DocumentType = "sow" | "proposal" | "contract" | "invoice";
export type PaymentStatus = "unpaid" | "paid" | "overdue";
export type OfferType = "10x_throughput" | "500_hour_reclaim" | "ai_visibility_engine";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  manager_id: string | null;
  client_id: string | null;
  created_at: string;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  clientId?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  offer: OfferType | null;
  retainer_amount: number;
  setup_fee: number;
  stage: ClientStage;
  contract_start: string | null;
  renewal_date: string | null;
  payment_status: PaymentStatus;
  last_payment_date: string | null;
  account_owner_id: string | null;
  project_lead_id: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: LeadStage;
  offer: OfferType | null;
  value: number;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  scope_summary: string | null;
  status: string;
  percent_complete: number;
  health: ProjectHealth;
  start_date: string | null;
  deadline: string | null;
  lead_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  type: DocumentType;
  title: string;
  content_json: string;
  version: number;
  signed: number;
  file_path: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  document_id: string | null;
  line_items_json: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  due_date: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  invoice_id: string | null;
  amount: number;
  gst_amount: number;
  type: string;
  description: string | null;
  paid_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  paid_at: string;
}

export interface CallLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  outcome: string;
  notes: string | null;
  logged_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  sent_count: number;
  reply_count: number;
  sentiment: string | null;
  logged_at: string;
}

export interface Meeting {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  user_id: string;
  title: string;
  scheduled_at: string;
  outcome: string | null;
  notes: string | null;
}

export interface ContentItem {
  id: string;
  title: string;
  platform: string;
  status: ContentStatus;
  owner_id: string | null;
  due_date: string | null;
  brief_json: string | null;
  keyword: string | null;
  ranking: string | null;
  last_checked: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  pinned: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export interface SalesTarget {
  id: string;
  user_id: string | null;
  month: string;
  target_amount: number;
  achieved_amount: number;
}

export interface ClientUpdate {
  id: string;
  client_id: string;
  project_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
}
