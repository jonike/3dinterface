import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as THREE from 'three';

import * as fs from 'fs';

import * as Serial from './Serial';

let Canvas = require('canvas');
let gl = require('gl');

let width = 1134;
let height = 768;

let imageNumber = 0;

function pixelsToFile(pixels : Uint8Array, path : string) {

    let str = 'P3\n' + width + ' ' + height + '\n' + 255 + '\n';

    // for(let i = (pixels.length / 4) - 1; i >= 0; i--) {
    for (let i = (pixels.length / 4) - 3; i > 0 ; i--) {
        str += pixels[4*i] + ' ' + pixels[4*i+1] + ' ' + pixels[4*i+2] + '\n';
    }

    fs.writeFileSync(path, str);

}

function main(path : string) {

    let canvas = new Canvas(width, height);
    canvas.addEventListener = function(t : any, listener : any) {
        canvas['on' + t] = listener;
    };

    let gl = require('gl')(width, height, { preserveDrawingBuffer: true })

    let renderer = new THREE.WebGLRenderer({canvas:canvas, context:gl});

    let geometry = new THREE.BoxGeometry(200, 200, 200);
    let material = new THREE.MeshPhongMaterial({color: 0xff0000});

    let mesh = new THREE.Mesh(geometry, material);

    let directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(300,600,500).normalize();

    let scene = new THREE.Scene();
    scene.add(mesh);
    scene.add(directionalLight);

    let camera = new l3d.Camera(50, width/height, 0.001, 1000000);
    camera.position.x = 300;
    camera.position.y = 300;
    camera.position.z = 300;

    camera.target.x = 0;
    camera.target.y = 0;
    camera.target.z = 0;

    camera.look();

    renderer.render(scene, camera);

    let pixels = new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    pixelsToFile(pixels, path);

}

if (require.main === module) {
    main(process.argv[2]);
}
