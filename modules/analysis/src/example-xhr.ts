import * as l3d from "l3d";

let loader = new l3d.XHRProgressiveLoader('bobomb%20battlefeild.obj', ()=>{},()=>{});
loader.load();
