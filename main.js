const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.set(0, 2, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas').appendChild(renderer.domElement);

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
`;
document.body.appendChild(cursor);

const trailCount = 30;
const trailGeometry = new THREE.BufferGeometry();
const trailPositions = new Float32Array(trailCount * 3);
const trailMaterial = new THREE.PointsMaterial({
    color: 0x7d7dff,
    size: 0.2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const glowTrailGeometry = new THREE.BufferGeometry();
const glowTrailPositions = new Float32Array(trailCount * 3);
const glowTrailMaterial = new THREE.PointsMaterial({
    color: 0x7d7dff,
    size: 0.4,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

for (let i = 0; i < trailCount; i++) {
    trailPositions[i * 3] = 0;
    trailPositions[i * 3 + 1] = 0;
    trailPositions[i * 3 + 2] = 0;
    
    glowTrailPositions[i * 3] = 0;
    glowTrailPositions[i * 3 + 1] = 0;
    glowTrailPositions[i * 3 + 2] = 0;
}

trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
glowTrailGeometry.setAttribute('position', new THREE.BufferAttribute(glowTrailPositions, 3));

const trail = new THREE.Points(trailGeometry, trailMaterial);
const glowTrail = new THREE.Points(glowTrailGeometry, glowTrailMaterial);
scene.add(trail);
scene.add(glowTrail);

const trailPositionsArray = [];
for (let i = 0; i < trailCount; i++) {
    trailPositionsArray.push(new THREE.Vector3(0, 0, 0));
}

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0x7d7dff, 0.8);
sun.position.set(1, 1, 1);
scene.add(sun);

const particleCount = 200;
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
    { name: 'sphere', geo: new THREE.SphereGeometry(1.5, 64, 64) },
    { name: 'cube', geo: new THREE.BoxGeometry(2, 2, 2) },
    { name: 'torus', geo: new THREE.TorusGeometry(1.5, 0.5, 32, 64) }
];

const gridPositions = [
    { x: -5, z: -5 },
    { x: 0, z: -8 },
    { x: 5, z: -5 }
];

const material = new THREE.MeshPhongMaterial({ 
    color: 0x7d7dff,
    shininess: 100,
    wireframe: true,
    wireframeLinewidth: 2
});

const stuff = [];
for (let i = 0; i < 3; i++) {
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
        pulseAmount: Math.random() * 0.2 + 0.1
    };
    scene.add(thing);
    stuff.push(thing);
}

const mouse = new THREE.Vector2();
const ray = new THREE.Raycaster();

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    const mouseWorld = new THREE.Vector3(mouse.x * 8, mouse.y * 8, -10);
    trailPositionsArray.unshift(mouseWorld.clone());
    trailPositionsArray.pop();
    
    for (let i = 0; i < trailCount; i++) {
        trailPositions[i * 3] = trailPositionsArray[i].x;
        trailPositions[i * 3 + 1] = trailPositionsArray[i].y;
        trailPositions[i * 3 + 2] = trailPositionsArray[i].z;
        
        glowTrailPositions[i * 3] = trailPositionsArray[i].x;
        glowTrailPositions[i * 3 + 1] = trailPositionsArray[i].y;
        glowTrailPositions[i * 3 + 2] = trailPositionsArray[i].z;
    }
    
    trailGeometry.attributes.position.needsUpdate = true;
    glowTrailGeometry.attributes.position.needsUpdate = true;
    
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
        
        const color = new THREE.Color();
        color.setHSL(Math.sin(Date.now() * 0.001 + i) * 0.1 + 0.5, 0.8, 0.5);
        thing.material.color = color;
    });
});

window.addEventListener('click', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    ray.setFromCamera(mouse, cam);
    const hits = ray.intersectObjects(stuff);
    
    if (hits.length > 0) {
        const thing = hits[0].object;
        const now = shapes.findIndex(s => s.name === thing.userData.type);
        const next = (now + 1) % shapes.length;
        
        thing.geometry = shapes[next].geo;
        thing.userData.type = shapes[next].name;
        thing.userData.rotationSpeed = {
            x: Math.random() * 0.02,
            y: Math.random() * 0.02,
            z: Math.random() * 0.02
        };
        thing.userData.pulseSpeed = Math.random() * 0.001 + 0.001;
        thing.userData.pulseAmount = Math.random() * 0.2 + 0.1;
        document.getElementById('shape').textContent = thing.userData.type;
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
    
    renderer.render(scene, cam);
}

animate(); 