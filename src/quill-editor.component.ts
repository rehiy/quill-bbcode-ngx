import { DOCUMENT, isPlatformServer } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import {
    AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Inject, Input, NgZone,
    OnChanges, OnDestroy, Output, PLATFORM_ID, Renderer2, SimpleChanges, ViewEncapsulation, SecurityContext
} from '@angular/core';

import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator } from '@angular/forms';

import { QuillConfig } from './quill-editor.interfaces';

import * as bbcode from 'discuz-bbcode';

// Because quill uses `document` directly, we cannot `import` during SSR
// instead, we load dynamically via `require('quill')` in `ngAfterViewInit()`
declare var require: any;
let Quill: any;


@Component({
    selector: 'quill-editor',
    template: `<ng-content select="[quill-editor-toolbar]"></ng-content>`,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => QuillEditorComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => QuillEditorComponent),
            multi: true
        }
    ],
    encapsulation: ViewEncapsulation.None
})
export class QuillEditorComponent
    implements AfterViewInit, ControlValueAccessor, OnChanges, OnDestroy, Validator {

    private disabled = false; // used to store initial value before ViewInit

    private quillEditor: any;
    private editorElem: HTMLElement;
    private content: any;

    private selectionChangeEvent: any;
    private textChangeEvent: any;
    private onModelChange: Function = () => { };
    private onModelTouched: Function = () => { };

    @Input() public format: 'object' | 'bbcode' | 'html' | 'text' | 'json' = 'html';
    @Input() public sanitize = false;
    @Input() public style: any = {};

    @Input() public maxLength: number;
    @Input() public minLength: number;
    @Input() public required: boolean;

    @Input() public bounds: HTMLElement | string;
    @Input() public formats: string[];
    @Input() public modules: { [index: string]: Object };
    @Input() public placeholder: string;
    @Input() public readOnly = false;
    @Input() public scrollingContainer: HTMLElement | string;
    @Input() public strict = true;
    @Input() public theme: string;

    @Output()
    public editorCreated: EventEmitter<any> = new EventEmitter();
    @Output()
    public contentChanged: EventEmitter<any> = new EventEmitter();
    @Output()
    public selectionChanged: EventEmitter<any> = new EventEmitter();

    constructor(
        private elementRef: ElementRef,
        private domSanitizer: DomSanitizer,
        private renderer: Renderer2,
        private zone: NgZone,
        @Inject(DOCUMENT) private doc: any,
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject('config') private config: QuillConfig,
    ) {
        this.config = this.config || {};
        this.config.modules = this.config.modules || {};
        this.config.language = this.config.language || '';
    }

    @Input()
    public valueGetter = (quillEditor: any, editorElement: HTMLElement): any => {
        switch (this.format) {
            case 'text':
                return quillEditor.getText();
            case 'object':
                return quillEditor.getContents();
            case 'json':
                try {
                    return JSON.stringify(quillEditor.getContents());
                } catch (e) {
                    return quillEditor.getText();
                }
        }

        const html: string = editorElement.children[0].innerHTML;
        if (html === '<p><br></p>' || html === '<div><br><div>') {
            return '';
        }

        if (this.format === 'bbcode') {
            return bbcode.build(html);
        }

        return html;
    }

    @Input()
    public valueSetter = (quillEditor: any, value: any): any => {
        if (this.format === 'html' || this.format === 'bbcode') {
            if (this.format === 'bbcode') {
                value = bbcode.parse(value);
            }
            if (this.sanitize) {
                value = this.domSanitizer.sanitize(SecurityContext.HTML, value);
            }
            return quillEditor.clipboard.convert(value);
        }

        if (this.format === 'json') {
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }

        return value;
    }

    public ngAfterViewInit() {
        if (isPlatformServer(this.platformId)) {
            return;
        }

        if (typeof Quill === 'undefined') {
            switch (this.config.language) {
                case 'chinese':
                    Quill = require('quill-chinese');
                    if (Quill.chineseToolbar) {
                        this.config.modules['toolbar'] = Quill.chineseToolbar;
                    }
                    break;
                default:
                    Quill = require('quill');
            }
            if (this.config.customOptions) {
                this.config.customOptions.forEach(customOption => {
                    const newCustomOption = Quill.import(customOption.import);
                    newCustomOption.whitelist = customOption.whitelist;
                    Quill.register(newCustomOption, true);
                });
            }
        }

        const modules = Object.assign({}, this.modules || this.config.modules);
        const toolbarElem = this.elementRef.nativeElement.querySelector(
            '[quill-editor-toolbar]'
        );
        if (toolbarElem) {
            modules['toolbar'] = toolbarElem;
        }

        let placeholder = 'Insert text here ...';
        if (this.placeholder !== null && this.placeholder !== undefined) {
            placeholder = this.placeholder.trim();
        }

        this.elementRef.nativeElement.insertAdjacentHTML(
            'beforeend', '<div quill-editor-element></div>'
        );
        this.editorElem = this.elementRef.nativeElement.querySelector(
            '[quill-editor-element]'
        );

        if (this.style) {
            Object.keys(this.style).forEach((key: string) => {
                this.renderer.setStyle(this.editorElem, key, this.style[key]);
            });
        }

        this.quillEditor = new Quill(this.editorElem, {
            bounds: this.bounds ? (this.bounds === 'self' ? this.editorElem : this.bounds) : this.doc.body,
            formats: this.formats,
            modules: modules,
            placeholder: placeholder,
            readOnly: this.readOnly,
            scrollingContainer: this.scrollingContainer,
            strict: this.strict,
            theme: this.theme || 'snow'
        });

        if (this.content) {
            if (this.format === 'object') {
                this.quillEditor.setContents(this.content, 'silent');
            } else if (this.format === 'text') {
                this.quillEditor.setText(this.content, 'silent');
            } else if (this.format === 'json') {
                try {
                    this.quillEditor.setContents(JSON.parse(this.content), 'silent');
                } catch (e) {
                    this.quillEditor.setText(this.content, 'silent');
                }
            } else {
                if (this.sanitize) {
                    this.content = this.domSanitizer.sanitize(SecurityContext.HTML, this.content);
                }
                const contents = this.quillEditor.clipboard.convert(this.content);
                this.quillEditor.setContents(contents, 'silent');
            }
            this.quillEditor.history.clear();
        }

        // initialize disabled status based on this.disabled as default value
        this.setDisabledState();

        this.editorCreated.emit(this.quillEditor);

        // mark model as touched if editor lost focus
        this.selectionChangeEvent = this.quillEditor.on(
            'selection-change',
            (range: any, oldRange: any, source: string) => {
                this.zone.run(() => {
                    this.selectionChanged.emit({
                        editor: this.quillEditor, range, oldRange, source
                    });
                    if (!range) {
                        this.onModelTouched();
                    }
                });
            }
        );

        // update model if text changes
        this.textChangeEvent = this.quillEditor.on(
            'text-change',
            (delta: any, oldDelta: any, source: string) => {
                const text = this.quillEditor.getText();
                const content = this.quillEditor.getContents();
                let html: string | null = this.editorElem.children[0].innerHTML;
                if (html === '<p><br></p>' || html === '<div><br><div>') {
                    html = null;
                }
                this.zone.run(() => {
                    this.onModelChange(this.valueGetter(this.quillEditor, this.editorElem));
                    this.contentChanged.emit({
                        editor: this.quillEditor, html, text, content, delta, oldDelta, source
                    });
                });
            }
        );
    }

    public ngOnDestroy() {
        if (this.selectionChangeEvent) {
            this.selectionChangeEvent.removeListener('selection-change');
        }
        if (this.textChangeEvent) {
            this.textChangeEvent.removeListener('text-change');
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (!this.quillEditor) {
            return;
        }
        if (changes['readOnly']) {
            this.quillEditor.enable(!changes['readOnly'].currentValue);
        }
        if (changes['placeholder']) {
            this.quillEditor.root.dataset.placeholder = changes['placeholder'].currentValue;
        }
    }

    public writeValue(currentValue: any) {
        this.content = currentValue;
        if (this.quillEditor) {
            if (currentValue) {
                if (this.format === 'text') {
                    this.quillEditor.setText(currentValue);
                } else {
                    this.quillEditor.setContents(this.valueSetter(this.quillEditor, this.content));
                }
                return;
            }
            this.quillEditor.setText('');
        }
    }

    public setDisabledState(isDisabled: boolean = this.disabled): void {
        // store initial value to set appropriate disabled status after ViewInit
        this.disabled = isDisabled;
        if (this.quillEditor) {
            if (isDisabled) {
                this.quillEditor.disable();
                this.renderer.setAttribute(this.elementRef.nativeElement, 'disabled', 'disabled');
            } else {
                if (!this.readOnly) {
                    this.quillEditor.enable();
                }
                this.renderer.removeAttribute(this.elementRef.nativeElement, 'disabled');
            }
        }
    }

    public registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    public registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    public validate() {
        if (!this.quillEditor) {
            return null;
        }

        let valid = true;

        const err: {
            minLengthError?: { given: number; minLength: number };
            maxLengthError?: { given: number; maxLength: number };
            requiredError?: { empty: boolean };
        } = {};

        const textLength = this.quillEditor.getText().trim().length;

        if (this.minLength && textLength && textLength < this.minLength) {
            err.minLengthError = {
                given: textLength,
                minLength: this.minLength
            };
            valid = false;
        }

        if (this.maxLength && textLength > this.maxLength) {
            err.maxLengthError = {
                given: textLength,
                maxLength: this.maxLength
            };
            valid = false;
        }

        if (this.required && !textLength) {
            err.requiredError = {
                empty: true
            };
            valid = false;
        }

        return valid ? null : err;
    }
}
