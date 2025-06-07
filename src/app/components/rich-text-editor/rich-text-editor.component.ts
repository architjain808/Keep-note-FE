import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() placeholder: string = 'Take a note...';
  @Input() minHeight: string = '120px';
  @Output() contentChange = new EventEmitter<string>();
  @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLDivElement>;

  content: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngAfterViewInit(): void {
    // Set initial content if any
    if (this.content) {
      this.editorRef.nativeElement.innerHTML = this.content;
    }
  }

  execCommand(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.updateContent();
  }

  isCommandActive(command: string): boolean {
    return document.queryCommandState(command);
  }

  onContentChange(event: Event): void {
    this.updateContent();
  }

  onFocus(): void {
    this.onTouched();
  }

  onBlur(): void {
    this.updateContent();
  }

  private updateContent(): void {
    const htmlContent = this.editorRef.nativeElement.innerHTML;
    this.content = htmlContent;
    this.onChange(htmlContent);
    this.contentChange.emit(htmlContent);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
    if (this.editorRef) {
      this.editorRef.nativeElement.innerHTML = this.content;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.editorRef) {
      this.editorRef.nativeElement.contentEditable = isDisabled ? 'false' : 'true';
    }
  }
}
