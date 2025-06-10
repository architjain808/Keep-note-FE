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
    console.log('Starting edit mode for note:', this.note.id);
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
    console.log('Delete button clicked for note:', this.note.id);
    this.noteDelete.emit(this.note.id);
  }

  onColorSelected(color: string): void {
    console.log('Color selected for note:', this.note.id, 'Color:', color);
    this.colorChange.emit({ id: this.note.id, color });
  }

  onEditContentChange(content: string): void {
    this.editContent = content;
  }

  private touchStartTime = 0;
  private hasTouchMoved = false;

  // Handle touch events for showing actions and editing
  onCardTouchStart(): void {
    this.touchStartTime = Date.now();
    this.hasTouchMoved = false;

    if (this.isTouchDevice && !this.isEditing) {
      this.showActions = true;
    }
  }

  onCardTouchMove(): void {
    this.hasTouchMoved = true;
  }

  onCardTouchEnd(event: TouchEvent): void {
    const touchDuration = Date.now() - this.touchStartTime;

    // Check if the touch target is an action button or its child
    const target = event.target as HTMLElement;
    if (target.closest('.note-actions')) {
      console.log('Touch on action button - not starting edit mode');
      return; // Don't start edit mode if touching action buttons
    }

    // Only trigger edit if it was a tap (not a scroll/swipe) and duration was short
    if (!this.hasTouchMoved && touchDuration < 500 && !this.isEditing) {
      event.preventDefault(); // Prevent the subsequent click event
      console.log('Touch tap detected - starting edit mode');
      this.startEdit();
    }
  }

  // Handle click for all devices (but avoid double-firing with touch)
  onCardClick(event: MouseEvent): void {
    // Check if the click target is an action button or its child
    const target = event.target as HTMLElement;
    if (target.closest('.note-actions')) {
      console.log('Click on action button - not starting edit mode');
      return; // Don't start edit mode if clicking on action buttons
    }

    if (!this.isEditing) {
      console.log('Click detected - starting edit mode');
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
