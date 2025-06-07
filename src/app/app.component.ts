import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Note } from './models/note.model';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Keep Clone';
  notes$!: Observable<Note[]>;

  constructor(private readonly notesService: NotesService) {}

  ngOnInit(): void {
    this.notes$ = this.notesService.getNotes();
  }

  onNoteSubmit(noteData: Partial<Note>): void {
    if (noteData.title || noteData.content) {
      this.notesService.addNote({
        title: noteData.title ?? '',
        content: noteData.content ?? '',
        color: noteData.color ?? '#ffffff'
      });
    }
  }

  onNoteUpdate(note: Note): void {
    this.notesService.updateNote(note.id, {
      title: note.title,
      content: note.content,
      color: note.color
    });
  }

  onNoteDelete(noteId: string): void {
    this.notesService.deleteNote(noteId);
  }

  onColorChange(data: {id: string, color: string}): void {
    this.notesService.changeNoteColor(data.id, data.color);
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }
}
