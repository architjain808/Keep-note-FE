import { Component, EventEmitter, Input, Output, OnInit, HostBinding } from '@angular/core';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-card',
  templateUrl: './note-card.component.html',
  styleUrls: ['./note-card.component.scss']
})
export class NoteCardComponent implements OnInit {
  @Input() note!: Note;
  @Output() noteUpdate = new EventEmitter<Note>();
  @Output() noteDelete = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<{id: string, color: string}>();

  isEditing = false;
  editTitle = '';
  editContent = '';

  // Add CSS class for touch devices
  @HostBinding('class.touch-device') isTouchDevice = false;
  @HostBinding('class.show-actions') showActions = false;

  ngOnInit(): void {
    // Detect if this is a touch device
    this.isTouchDevice = this.detectTouchDevice();

    // On touch devices, always show actions
    if (this.isTouchDevice) {
      this.showActions = true;
    }
  }

  private detectTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
    );
  }

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

  // Handle touch/click events for showing actions
  onCardTouchStart(): void {
    if (this.isTouchDevice && !this.isEditing) {
      this.showActions = true;
    }
  }

  onCardClick(): void {
    if (!this.isTouchDevice && !this.isEditing) {
      this.startEdit();
    }
  }

  // Handle mouse events for non-touch devices
  onCardMouseEnter(): void {
    if (!this.isTouchDevice) {
      this.showActions = true;
    }
  }

  onCardMouseLeave(): void {
    if (!this.isTouchDevice) {
      this.showActions = false;
    }
  }
}
