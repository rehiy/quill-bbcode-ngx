import { NgModule, ModuleWithProviders } from '@angular/core';

import { QuillEditorComponent } from './quill-editor.component';
import { QuillConfig } from './quill-editor.interfaces';
import { defaultConfig } from './quill-editor.vars';


@NgModule({
    declarations: [
        QuillEditorComponent
    ],
    imports: [],
    exports: [QuillEditorComponent],
    providers: [
        { provide: 'config', useValue: defaultConfig }
    ]
})
export class QuillModule {
    static forRoot(config?: QuillConfig): ModuleWithProviders {
        return {
            ngModule: QuillModule,
            providers: [
                { provide: 'config', useValue: config || defaultConfig }
            ]
        };
    }
}
