import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { Note, ApiNote, CreateNoteRequest, UpdateNoteRequest, DeleteNoteRequest } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly API_BASE_URL = 'https://keep-clone-be.onrender.com';
  private readonly notesSubject = new BehaviorSubject<Note[]>([]);
  public readonly notes$ = this.notesSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    // Load notes from API on initialization
    this.loadNotesFromAPI();
  }

  private loadNotesFromAPI(): void {
    this.http.get<ApiNote[]>(`${this.API_BASE_URL}/notes`)
      .pipe(
        catchError(error => {
          console.error('Error loading notes:', error);
          // Return empty array on error, but don't break the app
          return of([]);
        })
      )
      .subscribe(apiNotes => {
        const notes = this.convertApiNotesToNotes(apiNotes);
        this.notesSubject.next(notes);
      });
  }

  private convertApiNotesToNotes(apiNotes: ApiNote[]): Note[] {
    return apiNotes.map(apiNote => ({
      ...apiNote,
      createdAt: new Date(apiNote.createdAt),
      updatedAt: new Date(apiNote.createdAt) // API doesn't provide updatedAt, use createdAt
    }));
  }

  getNotes(): Observable<Note[]> {
    return this.notes$;
  }

  addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Optimistic update: Add note to UI immediately
    const tempId = this.generateTempId();
    const newNote: Note = {
      ...note,
      id: tempId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentNotes = this.notesSubject.value;
    this.notesSubject.next([newNote, ...currentNotes]);

    // Background API call
    const createRequest: CreateNoteRequest = {
      title: note.title,
      content: note.content,
      color: note.color
    };

    this.http.post<ApiNote>(`${this.API_BASE_URL}/notes/save`, createRequest)
      .pipe(
        catchError(error => {
          console.error('Error saving note:', error);
          // Remove the optimistically added note on error
          this.removeNoteFromUI(tempId);
          return of(null);
        })
      )
      .subscribe(savedNote => {
        if (savedNote) {
          // Replace temp note with real note from server
          this.replaceNoteInUI(tempId, {
            ...savedNote,
            createdAt: new Date(savedNote.createdAt),
            updatedAt: new Date(savedNote.createdAt)
          });
        }
      });
  }

  updateNote(id: string, updates: Partial<Note>): void {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(note => note.id === id);

    if (noteIndex !== -1) {
      const originalNote = currentNotes[noteIndex];

      // Optimistic update: Update UI immediately
      const updatedNote = {
        ...originalNote,
        ...updates,
        updatedAt: new Date()
      };

      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = updatedNote;
      this.notesSubject.next(updatedNotes);

      // Background API call
      const updateRequest: UpdateNoteRequest = {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        color: updatedNote.color
      };

      this.http.post<ApiNote>(`${this.API_BASE_URL}/notes/update`, updateRequest)
        .pipe(
          catchError(error => {
            console.error('Error updating note:', error);
            // Revert to original note on error
            this.revertNoteInUI(id, originalNote);
            return of(null);
          })
        )
        .subscribe(updatedApiNote => {
          if (updatedApiNote) {
            // Note: We don't need to update the UI again since optimistic update already worked
            // and the API call was successful. The optimistic update is sufficient.
            console.log('Note successfully updated on server');
          }
        });
    }
  }

  deleteNote(id: string): void {
    // Optimistic update: Remove from UI immediately
    const currentNotes = this.notesSubject.value;
    const noteToDelete = currentNotes.find(note => note.id === id);
    const filteredNotes = currentNotes.filter(note => note.id !== id);
    this.notesSubject.next(filteredNotes);

    // Background API call
    const deleteRequest: DeleteNoteRequest = {
      id: id
    };

    this.http.post(`${this.API_BASE_URL}/notes/delete`, deleteRequest)
      .pipe(
        catchError(error => {
          console.error('Error deleting note:', error);
          // Restore the note on error if we have it
          if (noteToDelete) {
            this.restoreNoteInUI(noteToDelete);
          }
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          console.log('Note successfully deleted from server');
        }
      });
  }

  changeNoteColor(id: string, color: string): void {
    this.updateNote(id, { color });
  }

  // Helper methods for optimistic updates
  private removeNoteFromUI(id: string): void {
    const currentNotes = this.notesSubject.value;
    const filteredNotes = currentNotes.filter(note => note.id !== id);
    this.notesSubject.next(filteredNotes);
  }

  private replaceNoteInUI(oldId: string, newNote: Note): void {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(note => note.id === oldId);

    if (noteIndex !== -1) {
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = newNote;
      this.notesSubject.next(updatedNotes);
    }
  }

  private revertNoteInUI(id: string, originalNote: Note): void {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(note => note.id === id);

    if (noteIndex !== -1) {
      const revertedNotes = [...currentNotes];
      revertedNotes[noteIndex] = originalNote;
      this.notesSubject.next(revertedNotes);
    }
  }

  private restoreNoteInUI(noteToRestore: Note): void {
    const currentNotes = this.notesSubject.value;
    // Add the note back to the beginning of the list
    this.notesSubject.next([noteToRestore, ...currentNotes]);
  }

  private generateTempId(): string {
    return 'temp_' + Date.now().toString() + Math.random().toString(36).substring(2, 11);
  }
}
