import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-form',
  templateUrl: './note-form.component.html',
  styleUrls: ['./note-form.component.scss']
})
export class NoteFormComponent {
  @Input() note: Note | null = null;
  @Output() noteSubmit = new EventEmitter<Partial<Note>>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  content = '';
  color = '#ffffff';
  isExpanded = false;

  ngOnInit(): void {
    if (this.note) {
      this.title = this.note.title;
      this.content = this.note.content;
      this.color = this.note.color;
      this.isExpanded = true;
    }
  }

  expandForm(): void {
    this.isExpanded = true;
  }

  onSubmit(): void {
    if (this.title.trim() || this.content.trim()) {
      this.noteSubmit.emit({
        title: this.title.trim(),
        content: this.content.trim(),
        color: this.color
      });
      this.resetForm();
    }
  }

  onSave(): void {
    this.onSubmit();
  }

  onCancel(): void {
    this.resetForm();
    this.cancel.emit();
  }

  onColorSelected(color: string): void {
    this.color = color;
  }

  onContentChange(content: string): void {
    this.content = content;
  }

  private resetForm(): void {
    this.title = '';
    this.content = '';
    this.color = '#ffffff';
    this.isExpanded = false;
  }
}
