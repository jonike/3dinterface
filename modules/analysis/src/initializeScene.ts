import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as THREE from 'three';
import * as fs from 'fs';
import * as Serial from './Serial';

import { selectScene } from './selectScene';

let Canvas = require('canvas');

export function initializeScene(configScene : config.Scene, width : number, height : number) {

    let sceneElements = selectScene(configScene);

    let triangleMeshes : { [id:string] : THREE.Mesh } = {};
    let colorToFace : THREE.Face3[] = [];

    let canvas = new Canvas(width, height);
    canvas.addEventListener = function(t : any, listener : any) {
        canvas['on' + t] = listener;
    };

    let gl = require('gl')(width, height, { preserveDrawingBuffer: true })

    // Disabling logging during WebGLRenderer initialization
    let tmpLog = console.log;
    let tmpWarn = console.warn;

    console.log = function() {};
    console.warn = function() {};

    let renderer = new THREE.WebGLRenderer({canvas:canvas, context:gl});
    renderer.setClearColor(0x000000);

    // Reenabling logging
    console.log = tmpLog;
    console.warn = tmpWarn;

    let scene = l3dp.createSceneFromConfig({
        scene: configScene,
        recommendationStyle: config.RecommendationStyle.BaseRecommendation
    }, width, height);

    let camera = new l3d.SphericCamera(50, width/height, 0.001, 1000000);
    scene.setCamera(camera);

    let modelMap = JSON.parse(fs.readFileSync(sceneElements.modelMapPath, 'utf-8'));
    let bigModel = Serial.loadFromFile(sceneElements.bigModelPath);
    let recommendationData = sceneElements.recommendationData;

    // For each small triangle
    let counter = 0;
    let material = new THREE.MeshFaceMaterial();
    for (let key in modelMap) {

        let geometry = new THREE.Geometry();
        geometry.vertices = (<THREE.Geometry>(<THREE.Mesh>bigModel.children[0]).geometry).vertices;

        for (let i = 0; i < modelMap[key].length; i++) {
            let face = modelMap[key][i];
            let split = face.split('-').map(function(o : string) { return parseInt(o,10) - 1; });
            let face3 = new THREE.Face3(split[0], split[1], split[2]);

            face3.materialIndex = counter;
            material.materials.push(new THREE.MeshBasicMaterial({color: counter+1}));
            colorToFace[counter] = face3;

            geometry.faces.push(face3);

            counter++;
        }

        triangleMeshes[key] = new THREE.Mesh(geometry, material);
        scene.add(triangleMeshes[key]);

    }

    return {
        sceneElements,
        canvas,
        gl,
        renderer,
        triangleMeshes,
        camera,
        modelMap,
        recommendationData,
        counter,
        scene
    };

}
