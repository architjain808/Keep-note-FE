export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
}

// API response interface (dates come as strings from API)
export interface ApiNote {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

// API request interfaces
export interface CreateNoteRequest {
  title: string;
  content: string;
  color: string;
}

export interface UpdateNoteRequest {
  id: string;
  title: string;
  content: string;
  color: string;
}

export interface DeleteNoteRequest {
  id: string;
}

export const NOTE_COLORS = [
  { name: 'Default', value: 'rgba(255, 255, 255, 0.9)' },
  { name: 'Red', value: '#fee2e2' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Green', value: '#dcfce7' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Indigo', value: '#e0e7ff' },
  { name: 'Purple', value: '#f3e8ff' },
  { name: 'Pink', value: '#fce7f3' },
  { name: 'Gray', value: '#f3f4f6' }
];
