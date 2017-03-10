declare module THREE {

    export interface WebGLRendererParameters {
        context?:any;
    }

    export interface Material {
        map: any;
    }

    export interface MaterialOptions {
        side ?: Side;
        wrap ?: Wrapping;
        normalizeRGB ?: boolean;
        ignoreZeroRGBs ?: boolean;
        invertTransparency ?: boolean;
    }

    export class MTLLoader extends EventDispatcher {

        manager : LoadingManager;

        constructor(baseUrl : string, options ?: MaterialOptions, crossOrigin ?: boolean);
        load(url : string, onLoad ?: Function, onProgress ?: Function, onError ?: Function) : void;
        setBaseUrl(value : string) : void;
        setCrossOrigin(value : boolean) : void;
        setMaterialOptions(value : MaterialOptions) : void;

        parse(text : string) : MTLLoader.MaterialCreator;

    }

    module MTLLoader {
        class MaterialCreator {

            baseUrl : string;
            options : MaterialOptions;
            materialsInfo : {[id:string] : Material};
            materials : {[id:string] : Material};
            materialsArray : Material[];
            side : Side;
            wrap : Wrapping;

            constructor(baseUrl : string, options : MaterialOptions);
            setCrossOrigin(value : boolean) : void;
            setManager(manager : LoadingManager) : void;
            setMaterials(materialsInfo : {[id:string] : Material}) : void;
            convert(materialsInfo : {[id:string] : Material}) : any;
            preload() : void;
            getIndex(name : string) : Material;
            getAsArray() : Material[];
            create(name : string) : Material;
            createMaterial_(name : string) : Material;
            loadTexture(url : string, mapping ?: Mapping, onLoad ?: Function, onProgress ?: Function, onError ?: Function) : void;
            ensurePowerOfTwo_(image : any) : any;
            nextHighestPowerOfTwo_(x : number) : number;

        }

    }

}
