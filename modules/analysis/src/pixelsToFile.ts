import * as fs from 'fs';

export function pixelsToFile(pixels : Uint8Array, width : number, height : number, path : string) {

    let str = 'P3\n' + width + ' ' + height + '\n' + 255 + '\n';

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let coordinate = (height-1-i)*width + j;
            str += pixels[4*coordinate] + ' ' + pixels[4*coordinate+1] + ' ' + pixels[4*coordinate+2] + '\n';
        }
    }

    fs.writeFileSync(path, str);

}


