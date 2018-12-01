export interface QuillToolbar {
    indent?: string;
    list?: string;
    direction?: string;
    header?: number | (boolean | number)[];
    color?: string[];
    background?: string[];
    align?: string[];
    script?: string;
    font?: string[];
    size?: (boolean | string)[];
}

export interface QuillModules {
    toolbar?: (string | QuillToolbar)[] | ((string | QuillToolbar)[])[];
    table?: boolean;
}

export interface QuillCustom {
    import: string;
    whitelist: Array<any>;
}

export interface QuillOptions {
    debug?: boolean;
    modules?: QuillModules;
    customs?: QuillCustom[];
    language?: '' | 'chinese';
}
