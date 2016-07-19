import * as THREE from 'three';
import * as l3d from 'l3d';

export function analyse(
    renderer : THREE.WebGLRenderer,
    scene : THREE.Scene,
    camera : l3d.SphericCamera) {

    camera.look();
    renderer.render(scene, camera);

    let gl = renderer.getContext();

    let width = renderer.domElement.width;
    let height = renderer.domElement.height;

    let pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);

    // Compute the histogram of the image
    let histogram : number[] = [];

    for (let i = 0; i < pixels.length - 3; i += 4) {

        let index = pixels[i] * 256 * 256 + pixels[i+1] * 256 + pixels[i+2] - 1;

        // Ignore black
        if (index === -1) {
            continue;
        }

        histogram[index] = histogram[index] === undefined ? 1 : histogram[index] + 1;

    }

    // Normalize the histogram and build the js array
    let sum = histogram.reduce((a,b) => a+b, 0);
    let array : {triangle:number, area:number}[] = [];

    for (let i in histogram) {

        array.push({
            triangle:parseInt(i,10),
            area:histogram[i] / sum
        });

    }

    // Sort it by decreasing area
    array.sort((a,b) => b.area - a.area);

    return {array, pixels};
}


