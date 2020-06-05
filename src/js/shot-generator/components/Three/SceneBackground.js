import React, { useEffect } from 'react'
import { useThree } from 'react-three-fiber'
import { useAsset } from '../../hooks/use-assets-manager'
import saveDataURLtoFile from '../../helpers/saveDataURLtoFile'
import path from 'path'
import fs from 'fs-extra'
let drawingCanvas = document.createElement('canvas');
let cropedCanvas = document.createElement('canvas');
let drawingCtx = drawingCanvas.getContext('2d');
let croppedCtx = cropedCanvas.getContext('2d');

let faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
const crop = (image, x, y, width, height, name, boardPath) => {
    drawingCtx.drawImage(image, 0, 0, image.width, image.height)
    var imageData = drawingCtx.getImageData(x, y, width, height);                                   
    croppedCtx.putImageData(imageData, 0, 0);   
    let dataUrl = croppedCtx.canvas.toDataURL()
    saveDataURLtoFile(dataUrl, `${name}.png`, 'models/sceneTextures/cubetexture', boardPath)
}

const getCubeMapTextures = (gltf, boardPath) => {
    let image = gltf.image
    drawingCanvas.width = image.width;
    drawingCanvas.height = image.height;
    fs.removeSync(path.join(path.dirname(boardPath), 'models/sceneTextures/cubetexture'))

    // 4 by 3 pattern when cubetexture has 4 columns and 3 rows 
    // -  py -  -
    // nx pz px nz
    // -  ny -  -
    if(image.width / 4 === image.height / 3) {
        let elementSize = image.width / 4  
        cropedCanvas.width = elementSize;
        cropedCanvas.height = elementSize;
        crop(image, elementSize,        0,                  elementSize, elementSize, "py", boardPath)
        crop(image, 0,                  elementSize,        elementSize, elementSize, "nx", boardPath)
        crop(image, elementSize,        elementSize,        elementSize, elementSize, "pz", boardPath)
        crop(image, elementSize * 2,    elementSize,        elementSize, elementSize, "px", boardPath)
        crop(image, elementSize * 3,    elementSize,        elementSize, elementSize, "nz", boardPath)
        crop(image, elementSize,        elementSize * 2,    elementSize, elementSize, "ny", boardPath)
    }
    // 3 by 4 pattern when cubetexture has 3 columns and 4 rows
    // -  py -
    // pz px nz
    // -  ny -
    // -  nx -
    if(image.width / 3 === image.height / 4) {
        let elementSize = image.width / 3  
        cropedCanvas.width = elementSize
        cropedCanvas.height = elementSize
        crop(image, elementSize,     0,               elementSize, elementSize, "py", boardPath)
        crop(image, 0,               elementSize,     elementSize, elementSize, "pz", boardPath)
        crop(image, elementSize,     elementSize,     elementSize, elementSize, "px", boardPath)
        crop(image, elementSize * 2, elementSize,     elementSize, elementSize, "nz", boardPath)
        crop(image, elementSize,     elementSize * 2, elementSize, elementSize, "ny", boardPath)
        crop(image, elementSize,     elementSize * 3, elementSize, elementSize, "nx", boardPath)
    }

    let row = image.width / 6 === image.height 
    let column = image.width === image.height / 6
    // 1 by 6 pattern when either we have 1 column or 1 row
    // px nx py ny pz nz
    if(row || column) {
        let elementSize = row ? image.height : image.width
        cropedCanvas.width = elementSize;
        cropedCanvas.height = elementSize;
        for( let i = 0; i < faces.length; i++ ) {
            crop(image, elementSize * row * i, elementSize * i * column, elementSize, elementSize, faces[i], boardPath)
        }
    }

    return new THREE.CubeTextureLoader()
    .setPath( path.join(path.dirname(boardPath), 'models/sceneTextures/cubetexture/') )
    .load( [
        'px.png#' + new Date().getTime(),
        'nx.png#' + new Date().getTime(),
        'py.png#' + new Date().getTime(),
        'ny.png#' + new Date().getTime(),
        'pz.png#' + new Date().getTime(),
        'nz.png#' + new Date().getTime()
    ])
}

const SceneBackground = React.memo(({ imagePath, world, storyboarderFilePath }) => {
    const {asset: gltf} = useAsset(imagePath[0])
    const { scene } = useThree()

    useEffect(() => {
        scene.background = new THREE.Color(world.backgroundColor)
    }, [world.backgroundColor])

    useEffect(() => {
        if(!gltf) return
        scene.background = getCubeMapTextures(gltf, storyboarderFilePath);
    }, [gltf])
     
    return null
})
export default SceneBackground;