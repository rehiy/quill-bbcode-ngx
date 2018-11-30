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
    toolbar: ((string | QuillToolbar)[])[] | { container: (string | QuillToolbar)[] };
}

export interface CustomOption {
    import: string;
    whitelist: Array<any>;
}

export interface QuillConfig {
    modules?: QuillModules | {};
    language?: '' | 'chinese';
    customOptions?: CustomOption[];
}
