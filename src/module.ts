import { NgModule, ModuleWithProviders } from '@angular/core';

import { QuillEditorComponent } from './component/quill-editor.component';
import { QuillOptions } from './component/quill-editor.interfaces';
import { QuillDefault } from './component/quill-editor.vars';


@NgModule({
    declarations: [
        QuillEditorComponent
    ],
    imports: [],
    exports: [QuillEditorComponent],
    providers: [
        { provide: 'config', useValue: QuillDefault }
    ]
})
export class QuillModule {
    static forRoot(config?: QuillOptions): ModuleWithProviders {
        return {
            ngModule: QuillModule,
            providers: [
                { provide: 'config', useValue: config || QuillDefault }
            ]
        };
    }
}
