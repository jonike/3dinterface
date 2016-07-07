import * as fs from 'fs';
var png = require('pngjs').PNG;

export function pixelsToFile(pixels : Uint8Array, width : number, height : number, path : string) {

    let newfile = new png({width:width, height:height});

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let originCoordinate      = (height-1-i)*width + j;
            let destinationCoordinate = i*width + j;

            newfile.data[4*destinationCoordinate]   = pixels[4*originCoordinate];
            newfile.data[4*destinationCoordinate+1] = pixels[4*originCoordinate+1];
            newfile.data[4*destinationCoordinate+2] = pixels[4*originCoordinate+2];
            newfile.data[4*destinationCoordinate+3] = pixels[4*originCoordinate+3];
        }
    }

    fs.writeFileSync(path, png.sync.write(newfile));

}


