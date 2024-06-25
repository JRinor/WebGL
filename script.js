import * as THREE from '/three.module.js';
import { OrbitControls } from '/OrbitControls.js';
import { GLTFLoader } from '/GLTFLoader.js';
import * as dat from '/dat.gui';
import { Reflector } from '/Reflector.js';

let camera, renderer, scene, cameraControls;
const clock = new THREE.Clock();

function init() {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x333333, 1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    camera = new THREE.PerspectiveCamera(35, canvasWidth / canvasHeight, 1, 4000);
    camera.position.set(-20, 20, 100);

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 10, 0);

    window.addEventListener('resize', onWindowResize);

    document.getElementById('webGL').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    fillScene();

    const gui = new dat.GUI();
    gui.add(camera.position, 'x', -100, 100);
    gui.add(camera.position, 'y', 0, 100);
    gui.add(camera.position, 'z', -100, 100);

    animate();
}

function fillScene() {
    scene.fog = new THREE.Fog(0x333333, 2000, 4000);
    scene.add(new THREE.AmbientLight(0x333333));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-200, 200, -400);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    const d = 300;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    loadModels();
    loadSkybox();
    addMirror();
    addAnimatedRing();
}

function loadModels() {
    const loader = new GLTFLoader();
    loader.load(
        'model/river/scene.gltf',
        (gltf) => {
            gltf.scene.scale.set(10, 10, 10);
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(gltf.scene);
        },
        undefined,
        (error) => {
            console.error('Error loading river model', error);
        }
    );

    loader.load(
        'model/bridge/scene.gltf',
        (gltf) => {
            gltf.scene.scale.set(0.85, 0.85, 0.85);
            gltf.scene.position.set(5, 20, 0);
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(gltf.scene);
        },
        undefined,
        (error) => {
            console.error('Error loading bridge model', error);
        }
    );

    const knight = createKnight();
    knight.scale.set(0.5, 0.5, 0.5);
    knight.position.set(-25, 10, 0);
    scene.add(knight);
}

function loadSkybox() {
    const loader = new GLTFLoader();
    loader.load(
        'model/skybox/scene.gltf',
        (gltf) => {
            scene.add(gltf.scene);
        },
        undefined,
        (error) => {
            console.error('Error loading skybox', error);
        }
    );
}

function createKnight() {
    const knight = new THREE.Group();
    const bodyTexture = new THREE.TextureLoader().load('img/maille.jpg', undefined, undefined, (err) => console.error('Error loading body texture', err));
    const bodyNormalMap = new THREE.TextureLoader().load('img/maille.jpg', undefined, undefined, (err) => console.error('Error loading body normal map', err));
    const bodyMaterial = new THREE.MeshStandardMaterial({
        map: bodyTexture,
        normalMap: bodyNormalMap,
        metalness: 1.0,
        roughness: 0.5
    });
    const bodyGeometry = new THREE.BoxGeometry(10, 20, 5);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 10, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    knight.add(body);
    const armorTexture = new THREE.TextureLoader().load('img/maille.jpg', undefined, undefined, (err) => console.error('Error loading armor texture', err));
    const armorNormalMap = new THREE.TextureLoader().load('img/maille.jpg', undefined, undefined, (err) => console.error('Error loading armor normal map', err));
    const armorMaterial = new THREE.MeshStandardMaterial({
        map: armorTexture,
        normalMap: armorNormalMap,
        metalness: 1.0,
        roughness: 0.3
    });
    const armorGeometry = new THREE.BoxGeometry(10, 10, 3);
    const armor = new THREE.Mesh(armorGeometry, armorMaterial);
    armor.position.set(0, 20, 0);
    armor.castShadow = true;
    armor.receiveShadow = true;
    knight.add(armor);
    const helmetGeometry = new THREE.CylinderGeometry(3, 3, 5, 8);
    const helmetMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 50 });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(0, 25, 0);
    helmet.castShadow = true;
    helmet.receiveShadow = true;
    knight.add(helmet);
    const sword = createSword();
    sword.position.set(5, 12, 0);
    knight.add(sword);
    return knight;
}

function createSword() {
    const sword = new THREE.Group();
    const bladeMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        specular: 0x222222,
        shininess: 30,
        transparent: true,
        opacity: 0.8
    });
    const bladeGeometry = new THREE.CylinderGeometry(0.5, 0.2, 25, 8);
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 12.5;
    blade.castShadow = true;
    blade.receiveShadow = true;
    sword.add(blade);
    const tipGeometry = new THREE.ConeGeometry(0.1, 2, 8);
    const tip = new THREE.Mesh(tipGeometry, bladeMaterial);
    tip.position.y = 25;
    tip.castShadow = true;
    tip.receiveShadow = true;
    sword.add(tip);
    const guardGeometry = new THREE.BoxGeometry(1, 1, 1);
    const guard = new THREE.Mesh(guardGeometry, bladeMaterial);
    guard.position.y = 6;
    guard.castShadow = true;
    guard.receiveShadow = true;
    sword.add(guard);
    const handleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
    const handle = new THREE.Mesh(handleGeometry, bladeMaterial);
    handle.position.y = 3;
    handle.castShadow = true;
    handle.receiveShadow = true;
    sword.add(handle);
    return sword;
}

function addMirror() {
    const mirrorGeometry = new THREE.PlaneGeometry(50, 50);
    const mirror = new Reflector(mirrorGeometry, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0x889999
    });
    mirror.position.y = 60;
    mirror.rotation.x = Math.PI / 2;
    scene.add(mirror);

    const frameThickness = 2;
    const frameGeometry = new THREE.BoxGeometry(50 + frameThickness * 2, frameThickness, frameThickness);
    const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const topFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    topFrame.position.set(0, 60, 25 + frameThickness / 2);
    scene.add(topFrame);

    const bottomFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    bottomFrame.position.set(0, 60, -25 - frameThickness / 2);
    scene.add(bottomFrame);

    const sideFrameGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, 50);
    const leftFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    leftFrame.position.set(-25 - frameThickness / 2, 60, 0);
    scene.add(leftFrame);

    const rightFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    rightFrame.position.set(25 + frameThickness / 2, 60, 0);
    scene.add(rightFrame);
}

function addAnimatedRing() {
    const textureLoader = new THREE.TextureLoader();
    const ringTexture = textureLoader.load('img/sprites.png', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1 / 8);
    });

    const ringMaterial = new THREE.MeshBasicMaterial({ map: ringTexture, transparent: true });
    const ringGeometry = new THREE.PlaneGeometry(10, 10);
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

    ringMesh.position.set(50, 22, -55);
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    scene.add(ringMesh);

    let currentFrame = 0;
    const totalFrames = 8;

    function updateRingAnimation() {
        const frameHeight = 1 / totalFrames;
        ringTexture.offset.y = currentFrame * frameHeight;
        currentFrame = (currentFrame + 1) % totalFrames;
    }

    setInterval(updateRingAnimation, 100);
}

function onWindowResize() {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    renderer.setSize(canvasWidth, canvasHeight);
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const delta = clock.getDelta();
    cameraControls.update(delta);
    renderer.render(scene, camera);
}

init();
