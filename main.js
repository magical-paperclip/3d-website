const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.1);

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.set(0, 2, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas').appendChild(renderer.domElement);

const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, cam);
composer.addPass(renderPass);

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
);
composer.addPass(bloomPass);

const glitchPass = new THREE.GlitchPass();
glitchPass.goWild = false;
composer.addPass(glitchPass);

const cursor = document.createElement('div');
cursor.style.cssText = `
    width: 20px;
    height: 20px;
    border: 2px solid #7d7dff;
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    transition: transform 0.1s ease;
    box-shadow: 0 0 10px #7d7dff;
`;
document.body.appendChild(cursor);

const lensFlare = new THREE.LensFlare();
scene.add(lensFlare);

const audioListener = new THREE.AudioListener();
cam.add(audioListener);

const ambientSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('ambient.mp3', function(buffer) {
    ambientSound.setBuffer(buffer);
    ambientSound.setLoop(true);
    ambientSound.setVolume(0.5);
    ambientSound.play();
});

const clickSound = new THREE.Audio(audioListener);
audioLoader.load('click.mp3', function(buffer) {
    clickSound.setBuffer(buffer);
    clickSound.setVolume(0.3);
});

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0x7d7dff, 0.8);
sun.position.set(1, 1, 1);
scene.add(sun);

const particleCount = 300;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleMaterial = new THREE.PointsMaterial({
    color: 0x7d7dff,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const glowGeometry = new THREE.BufferGeometry();
const glowPositions = new Float32Array(particleCount * 3);
const glowMaterial = new THREE.PointsMaterial({
    color: 0x7d7dff,
    size: 0.3,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    
    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
    
    glowPositions[i * 3] = x;
    glowPositions[i * 3 + 1] = y;
    glowPositions[i * 3 + 2] = z;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));

const particles = new THREE.Points(particleGeometry, particleMaterial);
const glowParticles = new THREE.Points(glowGeometry, glowMaterial);
scene.add(particles);
scene.add(glowParticles);

const shapes = [
    { name: 'sphere', geo: new THREE.SphereGeometry(2, 64, 64) },
    { name: 'cube', geo: new THREE.BoxGeometry(2.5, 2.5, 2.5) },
    { name: 'torus', geo: new THREE.TorusGeometry(2, 0.6, 32, 64) },
    { name: 'icosahedron', geo: new THREE.IcosahedronGeometry(2, 0) },
    { name: 'octahedron', geo: new THREE.OctahedronGeometry(2, 0) }
];

const gridPositions = [
    { x: -6, z: -6 },
    { x: 0, z: -10 },
    { x: 6, z: -6 }
];

const purpleShades = [
    0x8A2BE2, // BlueViolet
    0x9370DB, // MediumPurple
    0x9932CC  // DarkOrchid
];

const stuff = [];
for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshPhongMaterial({ 
        color: purpleShades[i],
        shininess: 100,
        wireframe: true,
        wireframeLinewidth: 2,
        emissive: purpleShades[i],
        emissiveIntensity: 0.3
    });

    const thing = new THREE.Mesh(shapes[i].geo, material);
    thing.position.set(gridPositions[i].x, 0, gridPositions[i].z);
    thing.userData = {
        type: shapes[i].name,
        originalPos: {x: gridPositions[i].x, y: 0, z: gridPositions[i].z},
        rotationSpeed: {x: Math.random() * 0.02, y: Math.random() * 0.02, z: Math.random() * 0.02},
        scale: 1,
        floatSpeed: Math.random() * 0.001 + 0.001,
        floatHeight: Math.random() * 0.5 + 0.5,
        pulseSpeed: Math.random() * 0.001 + 0.001,
        pulseAmount: Math.random() * 0.2 + 0.1,
        colorSpeed: Math.random() * 0.001 + 0.001,
        baseColor: purpleShades[i],
        morphing: false,
        morphProgress: 0
    };
    scene.add(thing);
    stuff.push(thing);
}

const mouse = new THREE.Vector2();
const ray = new THREE.Raycaster();
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function createExplosion(position) {
    const explosionGeometry = new THREE.BufferGeometry();
    const explosionCount = 50;
    const explosionPositions = new Float32Array(explosionCount * 3);
    const explosionMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < explosionCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2;
        explosionPositions[i * 3] = position.x + Math.cos(angle) * radius;
        explosionPositions[i * 3 + 1] = position.y + Math.sin(angle) * radius;
        explosionPositions[i * 3 + 2] = position.z;
    }

    explosionGeometry.setAttribute('position', new THREE.BufferAttribute(explosionPositions, 3));
    const explosion = new THREE.Points(explosionGeometry, explosionMaterial);
    scene.add(explosion);

    const duration = 1000;
    const startTime = Date.now();

    function animateExplosion() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
            explosion.material.opacity = 1 - progress;
            explosion.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
        }
    }

    animateExplosion();
}

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    if (isDragging) {
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        cam.rotation.y += deltaMove.x * 0.01;
        cam.rotation.x += deltaMove.y * 0.01;
    }

    previousMousePosition = {
        x: e.clientX,
        y: e.clientY
    };
    
    stuff.forEach(thing => {
        const dist = Math.sqrt(
            Math.pow(thing.position.x - (mouse.x * 8), 2) + 
            Math.pow(thing.position.z - (mouse.y * 8), 2)
        );
        
        thing.rotation.x += thing.userData.rotationSpeed.x;
        thing.rotation.y += thing.userData.rotationSpeed.y;
        thing.rotation.z += thing.userData.rotationSpeed.z;
        
        const pulse = Math.sin(Date.now() * thing.userData.pulseSpeed) * thing.userData.pulseAmount;
        const targetScale = 1 + 0.3 / dist + pulse;
        thing.userData.scale += (targetScale - thing.userData.scale) * 0.1;
        thing.scale.set(thing.userData.scale, thing.userData.scale, thing.userData.scale);
        
        thing.position.y = Math.sin(Date.now() * thing.userData.floatSpeed + i) * thing.userData.floatHeight;
        
        const color = new THREE.Color(thing.userData.baseColor);
        const brightness = 0.5 + Math.sin(Date.now() * thing.userData.colorSpeed) * 0.2;
        color.offsetHSL(0, 0, brightness - 0.5);
        thing.material.color = color;
        thing.material.emissive = color;
        thing.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;

        if (thing.userData.morphing) {
            thing.userData.morphProgress += 0.05;
            if (thing.userData.morphProgress >= 1) {
                thing.userData.morphing = false;
                thing.userData.morphProgress = 0;
            }
        }
    });
});

window.addEventListener('mousedown', () => {
    isDragging = true;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('wheel', (e) => {
    cam.position.z += e.deltaY * 0.01;
});

let lastClickTime = 0;
window.addEventListener('click', (e) => {
    const currentTime = Date.now();
    const isDoubleClick = currentTime - lastClickTime < 300;
    lastClickTime = currentTime;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    ray.setFromCamera(mouse, cam);
    const hits = ray.intersectObjects(stuff);
    
    if (hits.length > 0) {
        const thing = hits[0].object;
        
        if (isDoubleClick) {
            createExplosion(thing.position);
            clickSound.play();
        } else {
            const now = shapes.findIndex(s => s.name === thing.userData.type);
            const next = (now + 1) % shapes.length;
            
            thing.userData.morphing = true;
            thing.userData.morphProgress = 0;
            
            setTimeout(() => {
                thing.geometry = shapes[next].geo;
                thing.userData.type = shapes[next].name;
                thing.userData.rotationSpeed = {
                    x: Math.random() * 0.02,
                    y: Math.random() * 0.02,
                    z: Math.random() * 0.02
                };
                thing.userData.pulseSpeed = Math.random() * 0.001 + 0.001;
                thing.userData.pulseAmount = Math.random() * 0.2 + 0.1;
                thing.userData.colorSpeed = Math.random() * 0.001 + 0.001;
            }, 500);
            
            document.getElementById('shape').textContent = thing.userData.type;
        }
    }
});

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            cam.position.y += 0.5;
            break;
        case 'ArrowDown':
            cam.position.y -= 0.5;
            break;
        case 'ArrowLeft':
            cam.position.x -= 0.5;
            break;
        case 'ArrowRight':
            cam.position.x += 0.5;
            break;
        case '+':
            cam.position.z -= 0.5;
            break;
        case '-':
            cam.position.z += 0.5;
            break;
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    const positions = particleGeometry.attributes.position.array;
    const glowPositions = glowGeometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.02;
        glowPositions[i * 3 + 1] += 0.02;
        
        if (positions[i * 3 + 1] > 10) {
            positions[i * 3 + 1] = -10;
            glowPositions[i * 3 + 1] = -10;
        }
    }
    
    particleGeometry.attributes.position.needsUpdate = true;
    glowGeometry.attributes.position.needsUpdate = true;
    
    composer.render();
}

animate(); 
animate(); 