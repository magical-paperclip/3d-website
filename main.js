const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.set(0, 2, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas').appendChild(renderer.domElement);

// Custom mouse cursor
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

// Ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Directional light
const sun = new THREE.DirectionalLight(0x7d7dff, 0.8);
sun.position.set(1, 1, 1);
scene.add(sun);

// Background particles
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

// Add glow effect
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
    { name: 'sphere', geo: new THREE.SphereGeometry(1, 32, 32) },
    { name: 'cube', geo: new THREE.BoxGeometry(1, 1, 1) },
    { name: 'torus', geo: new THREE.TorusGeometry(1, 0.3, 16, 32) }
];

// Grid positions
const gridPositions = [
    { x: -2, z: -2 },
    { x: 0, z: -2 },
    { x: 2, z: -2 }
];

// Materials
const material = new THREE.MeshPhongMaterial({ 
    color: 0x7d7dff,
    shininess: 100,
    wireframe: true
});

// Create shapes in grid
const stuff = [];
for (let i = 0; i < 3; i++) {
    const thing = new THREE.Mesh(shapes[i].geo, material);
    thing.position.set(gridPositions[i].x, 0, gridPositions[i].z);
    thing.userData = {
        type: shapes[i].name,
        originalPos: {x: gridPositions[i].x, y: 0, z: gridPositions[i].z}
    };
    scene.add(thing);
    stuff.push(thing);
}

// Mouse tracking
const mouse = new THREE.Vector2();
const ray = new THREE.Raycaster();

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    stuff.forEach(thing => {
        const dist = Math.sqrt(
            Math.pow(thing.position.x - (mouse.x * 5), 2) + 
            Math.pow(thing.position.z - (mouse.y * 5), 2)
        );
        thing.rotation.x += 0.01;
        thing.rotation.y += 0.01;
        thing.scale.set(1 + 0.1 / dist, 1 + 0.1 / dist, 1 + 0.1 / dist);
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
        document.getElementById('shape').textContent = thing.userData.type;
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    // Animate background particles
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