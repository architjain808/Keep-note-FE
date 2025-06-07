import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-card',
  templateUrl: './note-card.component.html',
  styleUrls: ['./note-card.component.scss']
})
export class NoteCardComponent {
  @Input() note!: Note;
  @Output() noteUpdate = new EventEmitter<Note>();
  @Output() noteDelete = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<{id: string, color: string}>();

  isEditing = false;
  editTitle = '';
  editContent = '';

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.note.title;
    this.editContent = this.note.content;
  }

  saveEdit(): void {
    if (this.editTitle.trim() || this.editContent.trim()) {
      const updatedNote: Note = {
        ...this.note,
        title: this.editTitle.trim(),
        content: this.editContent.trim(),
        updatedAt: new Date()
      };
      this.noteUpdate.emit(updatedNote);
    }
    this.isEditing = false;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editTitle = this.note.title;
    this.editContent = this.note.content;
  }

  deleteNote(): void {
    this.noteDelete.emit(this.note.id);
  }

  onColorSelected(color: string): void {
    this.colorChange.emit({ id: this.note.id, color });
  }

  onEditContentChange(content: string): void {
    this.editContent = content;
  }
}
