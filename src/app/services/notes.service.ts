import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, timeout, retry, takeUntil, Subject } from 'rxjs';
import { Note, ApiNote, CreateNoteRequest, UpdateNoteRequest, DeleteNoteRequest } from '../models/note.model';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService implements OnDestroy {
  private readonly API_BASE_URL = environment.apiUrl;
  private readonly notesSubject = new BehaviorSubject<Note[]>([]);
  public readonly notes$ = this.notesSubject.asObservable();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private readonly socketService: SocketService
  ) {
    // Load notes from API on initialization
    this.loadNotesFromAPI();
    // Setup socket listeners for real-time updates
    this.setupSocketListeners();

    // Expose notes service for debugging in development
    if (!environment.production) {
      (window as any).notesService = this;
      console.log('Notes service exposed as window.notesService for debugging');
    }
  }

  private loadNotesFromAPI(): void {
    this.http.get<ApiNote[]>(`${this.API_BASE_URL}/notes`)
      .pipe(
        timeout(10000), // 10 second timeout
        retry(2), // Retry up to 2 times
        catchError((error: HttpErrorResponse) => {
          this.logError('Error loading notes', error);
          // Return empty array on error, but don't break the app
          return of([]);
        })
      )
      .subscribe({
        next: (apiNotes) => {
          const notes = this.convertApiNotesToNotes(apiNotes);
          this.notesSubject.next(notes);
        },
        error: (error) => {
          this.logError('Subscription error loading notes', error);
        }
      });
  }

  private convertApiNotesToNotes(apiNotes: ApiNote[]): Note[] {
    return apiNotes.map(apiNote => ({
      ...apiNote,
      createdAt: new Date(apiNote.createdAt),
      updatedAt: new Date(apiNote.createdAt) // API doesn't provide updatedAt, use createdAt
    }));
  }

  private setupSocketListeners(): void {
    console.log('Setting up socket listeners for notesUpdate event...');

    // Listen for real-time notes updates from socket (complete list)
    // This event is sent for all operations: add, update, delete
    this.socketService.on<ApiNote[]>('notesUpdate')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiNotes) => {
          console.log('📡 Received real-time notes update:', apiNotes);
          this.handleSocketUpdate(apiNotes, 'notesUpdate');
        },
        error: (error) => {
          console.error('❌ Error in socket notes update:', error);
          // Fallback: refresh from API on error
          this.refreshNotesFromAPI();
        }
      });

    // Monitor socket connection status
    this.socketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isConnected => {
        if (isConnected) {
          console.log('✅ Socket connected, ready to receive real-time updates');
        } else {
          console.log('❌ Socket disconnected, real-time updates paused');
        }
      });
  }



  getNotes(): Observable<Note[]> {
    return this.notes$;
  }

  // Method to refresh notes from API (useful for socket fallback)
  refreshNotesFromAPI(): void {
    console.log('Refreshing notes from API...');
    this.loadNotesFromAPI();
  }

  // Method to handle socket updates with conflict resolution
  private handleSocketUpdate(apiNotes: ApiNote[], source: string): void {
    console.log(`🔄 Processing socket update from ${source}:`, {
      receivedCount: apiNotes.length,
      receivedNotes: apiNotes.map(n => ({ id: n.id, title: n.title }))
    });

    // Validate the received data
    if (!Array.isArray(apiNotes)) {
      console.error('❌ Invalid socket data: expected array of notes', apiNotes);
      return;
    }

    // Convert API notes to local format
    const notes = this.convertApiNotesToNotes(apiNotes);

    // Get current notes
    const currentNotes = this.notesSubject.value;

    console.log(`📊 Current state: ${currentNotes.length} notes, New state: ${notes.length} notes`);

    // Check if this is a meaningful update (different from current state)
    const hasChanges = this.hasNotesChanged(currentNotes, notes);

    if (hasChanges) {
      console.log(`✅ Notes have changed, updating UI from ${source}`);
      this.notesSubject.next(notes);
    } else {
      console.log(`ℹ️ No changes detected from ${source}, skipping update`);
    }
  }

  private hasNotesChanged(currentNotes: Note[], newNotes: Note[]): boolean {
    // Quick length check
    if (currentNotes.length !== newNotes.length) {
      console.log(`📏 Length changed: ${currentNotes.length} -> ${newNotes.length}`);
      return true;
    }

    // Filter out temp notes from current notes for comparison
    const currentRealNotes = currentNotes.filter(n => !n.id.startsWith('temp_'));
    const newRealNotes = newNotes.filter(n => !n.id.startsWith('temp_'));

    // Check if real notes count changed
    if (currentRealNotes.length !== newRealNotes.length) {
      console.log(`📏 Real notes count changed: ${currentRealNotes.length} -> ${newRealNotes.length}`);
      return true;
    }

    // Check if any note content has changed
    for (const newNote of newRealNotes) {
      const currentNote = currentRealNotes.find(n => n.id === newNote.id);
      if (!currentNote) {
        console.log(`➕ New note found: ${newNote.id}`);
        return true; // New note found
      }

      // Check if content differs
      if (currentNote.title !== newNote.title ||
          currentNote.content !== newNote.content ||
          currentNote.color !== newNote.color) {
        console.log(`✏️ Note content changed: ${newNote.id}`);
        return true;
      }
    }

    // Check if any notes were removed
    for (const currentNote of currentRealNotes) {
      const newNote = newRealNotes.find(n => n.id === currentNote.id);
      if (!newNote) {
        console.log(`🗑️ Note removed: ${currentNote.id}`);
        return true;
      }
    }

    return false;
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

  private logError(message: string, error: any): void {
    if (environment.enableDebugMode) {
      console.error(message, error);

      // Additional error details for debugging
      if (error instanceof HttpErrorResponse) {
        console.error('HTTP Error Details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
      }
    } else {
      // In production, log minimal error info
      console.error(message, error?.message ?? 'Unknown error');
    }
  }

  // Debug method to test socket integration
  testSocketIntegration(): void {
    console.log('🧪 Testing socket integration...');
    console.log('Socket connected:', this.socketService.isConnected());
    console.log('Current notes count:', this.notesSubject.value.length);

    // Test emitting a request for notes update
    this.socketService.emit('requestNotesUpdate', { timestamp: Date.now() });
    console.log('Sent requestNotesUpdate event to server');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
