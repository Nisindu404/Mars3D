import * as THREE from "three";
// Import the OrbitControls module from the Three.js examples directory
// This allows for interactive control of the camera using mouse or touch input
import {OrbitControls} from "jsm/controls/OrbitControls.js";
import {GLTFLoader} from "jsm/loaders/GLTFLoader.js";

import getStarfield from "./src/getStarfield.js";
import {getFresnelMat} from "./src/getFresnelMat.js";

//renderrer, camera and scene object is 3 things needed


// ==== R E N D E R R E R ====
//for renderrer width and height of the window
const w = window.innerWidth;
const h = window.innerHeight;
const renderrer = new THREE.WebGLRenderer({antialias: true});
renderrer.setSize(w, h); // now set the renderrer width and height
document.body.appendChild(renderrer.domElement);


// ====  C A M E R A ==== 
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;



// ==== S  C  E  N  E ====
// Create a new scene where all objects will be added
const scene = new THREE.Scene();

const marsGroup = new THREE.Group();
marsGroup.rotation.z = -23.5 * Math.PI / 180;
scene.add(marsGroup);


const controls = new OrbitControls(camera, renderrer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.minDistance = 1.1;  // Minimum zoom distance
controls.maxDistance = 80;    

const loader = new THREE.TextureLoader();

//const geo = new THREE.IcosahedronGeometry(1.0, 13);
const geo = new THREE.SphereGeometry(1.0, 128, 128);

const mat = new THREE.MeshStandardMaterial({
    map: loader.load("./assets/8k_mars.jpg"),
    flatShading: false,
    roughness: 0.6,// Adjust surface roughness
    side: THREE.FrontSide
});
// Create a mesh by combining the geometry and material
const marsMesh = new THREE.Mesh(geo, mat);
// Add the mesh to the scene
scene.add(marsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load("./textures/cloud.png"),
    //transparent: true,
    //opacity: 0.5,
    blending: THREE.AdditiveBlending,
    flatShading: false
});
const marsClouds = new THREE.Mesh(geo, cloudsMat);
marsClouds.scale.setScalar(1.02); // Slightly larger to prevent z-fighting
marsGroup.add(marsClouds);

const fresnwlMat = getFresnelMat();
const martianGlowEffect = new THREE.Mesh(geo, fresnwlMat);
martianGlowEffect.scale.setScalar(1.021);
marsGroup.add(martianGlowEffect);

const stars = getStarfield({numStars: 4000});
scene.add(stars);



/**
 * Material configuration for rendering a mesh with a wireframe.
 * This uses the `THREE.MeshBasicMaterial` to create a material with a white color
 * and enables the wireframe mode for the mesh.
 */
const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, 
    wireframe: true
});
// Create a wireframe mesh using the same geometry but with a wireframe material
const wireMesh = new THREE.Mesh(geo, wireMat);
// Slightly scale up the wireframe mesh to prevent z-fighting with the main mesh
wireMesh.scale.setScalar(1.001);
// Add the wireframe mesh as a child of the main mesh
//marsMesh.add(wireMesh);

// Add a hemisphere light to the scene for ambient lighting(top is white and bottom is black)
/*const heniLight = new THREE.HemisphereLight(0xffffff, 0x000000);
scene.add(heniLight);*/ 
const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(-5,3,4);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x101010, 2);// Almost black ambient light
scene.add(ambientLight);

renderrer.shadowMap.enabled = true;
sunLight.castShadow = true;
marsMesh.castShadow = true;
marsMesh.receiveShadow = true;

// Spaceship variables
let spaceship = null;

// Spaceship orbit parameters
const orbitRadius = 1.3;
const orbitSpeed = 0.5;

// Load the spaceship model
new GLTFLoader().load('./assets/3d_t.i.e_fighter_-_star_wars_model.glb', function(glif) {
    spaceship = glif.scene;
    
    // Scale and position the spaceship
    spaceship.scale.set(0.02, 0.02, 0.02); // Adjust scale as needed
    
    // Add the spaceship to the scene
    scene.add(spaceship);
});




// A N I M A T I O N   L O O P
/**
 * Animates the scene by updating the rotation of the mesh and rendering the scene.
 * This function is recursively called using `requestAnimationFrame` to create a smooth animation loop.
 *
 * @param {number} [t=0] - The current timestamp, automatically provided by `requestAnimationFrame`.
 */
function animate(t = 0) {
    requestAnimationFrame(animate); // Schedule the next frame
    marsMesh.rotation.y = t * 0.00007;
    marsClouds.rotation.y = t * 0.00011;
    stars.rotation.z = t * 0.00001;

    // Spaceship orbital movement
    if (spaceship) {
        // Calculate orbital position
        const angle = t * orbitSpeed * 0.0005;
        spaceship.position.x = Math.cos(angle) * orbitRadius;
        spaceship.position.z = Math.sin(angle) * orbitRadius;
        
        // Optional: Make spaceship face the center of the planet
        spaceship.lookAt(0, 0, 0);
    }
    renderrer.render(scene, camera); // Render the scene with the camera
    controls.update();
}
animate();