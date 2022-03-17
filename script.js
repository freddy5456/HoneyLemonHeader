//To Do: REMOVE ALL THINGS RELATED TO THE VIDEO ITSELF (ALSO IN INDEX.HTML)

// 3d Logo Video Generator 

// How to:


// 1) 

// Place .obj File with the logo in the "assets" folder (if there is no "assets" folder right now
// create one in the main dict). Important: Only .obj will work. Then set name of the file here:

var logoFilename = "NONO";


// 2)

// Extract all frames from the video and place them in the folder "assets/frames". The name 
// of the files should be "backgroundXXX.jpg" whereby XXX is the number of the frame (starting with 000.
// Then put the total number of frames here:

const frameMax = 716;


// 3)

// Set the correct resolution of the video here:

var width = 1080;
var height = 1920;


// 4)

// Set how many rotation the logo should do during the video. The more rotations the faster the movement.

var rotations = 7;


// 5)

// Almost done. Here are some additional parameters. But mostly you want to leave the the same and 
// change nothing here.

var refractionQulity = 2048; //The quality of the refraction in the logo. The higher the better. Init: 2048
var transparentBackground = false; //Should the background be transparent?


// 6)

// Okay all done now. You can start the site now in your browser and check if everything looks good. 
// Most likely you have to adjust the size of the Logo. The smaller the logoSize Value, the bigger the logo
// If all looks fine, set "saveFrames" to true and let the video play one complete time, while the
// animation is rendering. After the first loop, all your frames get downloaded.

var logoSize = 0.2; //logo size
var saveFrames = false;

//**** end how to  



// Calculate the rotation increment
var radInc = rotations * 2 * Math.PI / (frameMax+1);

// Get the video canvas
var canvas = document.getElementById("videoCanvas");

// Set video plane Distance to 50 (which is good here)
var videoPlaneDistance = 50;

//initialize renderer, camera and scene
const renderer = new THREE.WebGLRenderer({
    antialias: true, 
    alpha: true,
    canvas: canvas
});
const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
const scene = new THREE.Scene();

// Create a capturer that exports PNG images in a TAR file
var capturer = new CCapture( { format: 'png', framerate: 30 } );

//initialize stats
var stats = new Stats();

//declare variables
let logo3d;
let logoMaterial;
var videoPlane;
var cubeCamera;
var loadedVideoMaterial = false;
var loadedObj = false;
var frameCount = 0;


//initialization function
function init() {

    //Set camera position and renderer Size
    let dz = logoSize/(2 * Math.tan(camera.fov/2) * camera.aspect);
    camera.position.set(0, 0, -dz);
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    //Create Video Plane with first frame
    var videoPlaneSize = getVideoPlaneSize();
    var videoPlaneGeometry = new THREE.PlaneGeometry(videoPlaneSize[0], videoPlaneSize[1]);
    var thumbnailTexture = new THREE.TextureLoader().load("assets/frames/background000.jpg");
    var thumbnailMaterial = new THREE.MeshBasicMaterial( { map: thumbnailTexture } );
    videoPlane = new THREE.Mesh( videoPlaneGeometry, thumbnailMaterial );
    scene.add( videoPlane );
    videoPlane.position.set(0, 0, -videoPlaneDistance);

    //Create logo material and cubeCamera
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( refractionQulity, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );
    cubeCamera = new THREE.CubeCamera( 0.1, 100000, cubeRenderTarget );
    scene.add( cubeCamera );
    cubeCamera.position.set(0, 0, -dz);
    const refractionTexture = cubeRenderTarget.texture;
    refractionTexture.mapping = THREE.CubeRefractionMapping;
    const logoMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: refractionTexture, refractionRatio: 0.97} );

    //Load 3d logo from .obj file
    const loader = new THREE.OBJLoader();
    loader.load( 'assets/'+logoFilename+'.obj',
        function( obj ){
            obj.traverse( function( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = logoMaterial;
                }
            } );
            scene.add( obj );
            obj.position.x = 0;
            obj.position.y = 0;
            obj.position.z = 0;
            logo3d = obj;
            console.log("Done loading 3D Logo.");
            loadedObj = true;
        },
        function ( xhr ) {

            console.log("Loading 3D Logo: " + ( xhr.loaded / xhr.total * 100 ) + "%");

        },
        function( err ){
            console.error( "Error while loading 3D Logo.");
        }
    );
}


//function to adjust video plane to window size
function getVideoPlaneSize() {
    let ang_rad = camera.fov * Math.PI / 180;
    let fov_y = (camera.position.z + videoPlaneDistance) * Math.tan(ang_rad / 2) * 2;
    var videoAspect = width / height;
    var windowAspect = width / height;
    var planeSize = [fov_y * width / height, fov_y];
    if ( videoAspect < camera.aspect) {
        planeSize = [fov_y * camera.aspect, fov_y * camera.aspect * 9 / 16];
    }
    return planeSize;
}


//function to adjust the light
function setLight() {
    const light = new THREE.HemisphereLight( 0xFFFFFF, 0xFFFFFF, 0.8);
    scene.add( light );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.25 );
    scene.add( directionalLight );
    directionalLight.position.set(10, 10, 10);
}


//Animation function which is executed every frame
function animate() {
    //Update stats
    stats.update();

    //rotate logo
    if (logo3d && logo3d.rotation) {

        logo3d.rotation.y += radInc;
    }

    //Update cubeCamera
    cubeCamera.update(renderer, scene);

    //render scene
    if (transparentBackground == true) videoPlane.visible = false;
    renderer.render(scene, camera);
    if (transparentBackground == true) videoPlane.visible = true;
    
    //capture frame
    if (saveFrames == true) capturer.capture( canvas );

    loadNextVideoFrame();
}

function loadNextVideoFrame() {
    
    //load frame as image 
    new THREE.TextureLoader().load("assets/frames/background" + pad(frameCount, 3) + ".jpg", function(videoTexture) {
        var videoMaterial = new THREE.MeshBasicMaterial( { map: videoTexture } );
        
        //keep track of frames
        if (frameMax == frameCount) {
            if (saveFrames == true) capturer.stop();
            if (saveFrames == true) capturer.save();
            frameCount = 0;
        } else {
            frameCount += 1;
        }
        
        //Change video plane material
        videoPlane.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = videoMaterial;
            }
        } );
        
        //console.log("loaded frame " + pad(frameCount, 3));
        
        //and lets render the new frame with 3d logo
        requestAnimationFrame(animate);
    });
    
}

//map function
function map(value, start1, stop1, start2, stop2) {
    var result = (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    return result;
}

function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length-size);
}

//Start everything
init();
setLight();
if (saveFrames == true) capturer.start();
animate();