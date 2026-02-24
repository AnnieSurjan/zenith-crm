export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  created_at: string;
}

export interface Deal {
  id: number;
  client_id: number;
  client_name?: string;
  title: string;
  value: number;
  status: 'prospect' | 'offer_sent' | 'won' | 'lost';
  description: string;
  created_at: string;
}

export interface Task {
  id: number;
  client_id: number;
  client_name?: string;
  assigned_to?: number;
  assignee_name?: string;
  title: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  type?: 'call' | 'email' | 'meeting' | 'admin' | 'other';
  priority?: 'low' | 'medium' | 'high';
  status?: 'new' | 'in_progress' | 'done' | 'review';
  closure_type?: 'successful' | 'unsuccessful';
  attachments?: { name: string; url: string; size: string }[];
  history?: { user: string; action: string; time: string }[];
}

export interface Interaction {
  id: number;
  client_id: number;
  type: 'call' | 'email' | 'meeting' | 'note';
  content: string;
  created_at: string;
}

export interface ClientDetail extends Client {
  deals: Deal[];
  tasks: Task[];
  interactions: Interaction[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar: string;
  created_at: string;
}

export interface Invitation {
  id: number;
  email: string;
  role: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name?: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
}
