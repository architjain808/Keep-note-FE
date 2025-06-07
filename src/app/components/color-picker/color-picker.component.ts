import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NOTE_COLORS } from '../../models/note.model';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent {
  @Input() currentColor = '#ffffff';
  @Output() colorSelected = new EventEmitter<string>();

  colors = NOTE_COLORS;

  selectColor(color: string): void {
    this.colorSelected.emit(color);
  }
}
