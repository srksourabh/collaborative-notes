// TypeScript types matching database schema exactly

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface Class {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassMember {
  id: string;
  class_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  class_id: string;
  color: string;
  icon: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  subject_id: string;
  author_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteImage {
  id: string;
  note_id: string;
  image_url: string;
  caption: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface NoteUrl {
  id: string;
  note_id: string;
  url: string;
  title: string | null;
  added_by: string | null;
  added_at: string;
}

export interface NoteShare {
  id: string;
  note_id: string;
  shared_by: string;
  shared_with_user: string | null;
  shared_with_class: string | null;
  share_type: 'view' | 'edit';
  shared_at: string;
}

export interface Comment {
  id: string;
  note_id: string;
  parent_id: string | null;
  content: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

export interface EditHistory {
  id: string;
  note_id: string;
  edited_by: string | null;
  content_before: string | null;
  content_after: string | null;
  edited_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Extended types with joins
export interface NoteWithAuthor extends Note {
  author: Pick<User, 'id' | 'full_name' | 'username'> | null;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'full_name' | 'username'> | null;
  replies?: CommentWithAuthor[];
}

export interface ClassWithMembers extends Class {
  member_count?: number;
}

export interface SubjectWithNoteCount extends Subject {
  note_count?: number;
}
