const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.set(0, 2, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
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
    box-shadow: 0 0 10px #7d7dff;
`;
document.body.appendChild(cursor);

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
    { name: 'torus', geo: new THREE.TorusGeometry(2, 0.6, 32, 64) }
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
        baseColor: purpleShades[i]
    };
    scene.add(thing);
    stuff.push(thing);
}

const mouse = new THREE.Vector2();
const ray = new THREE.Raycaster();

const explosionParticles = [];
const maxExplosionParticles = 200;

for (let i = 0; i < maxExplosionParticles; i++) {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.visible = false;
    scene.add(particle);
    explosionParticles.push(particle);
}

function createExplosion(position, color) {
    const activeParticles = explosionParticles.filter(p => !p.visible);
    const count = Math.min(50, activeParticles.length);
    
    for (let i = 0; i < count; i++) {
        const particle = activeParticles[i];
        particle.position.copy(position);
        particle.material.color.set(color);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            ),
            life: 1.0,
            scale: 0.2 + Math.random() * 0.3,
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            )
        };
        particle.scale.set(1, 1, 1);
        particle.visible = true;
    }
}

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
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
        
        // Create explosion at current position
        createExplosion(thing.position.clone(), thing.material.color);
        
        // Hide current shape
        thing.visible = false;
        
        // Create new shape after a delay
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
            thing.visible = true;
            document.getElementById('shape').textContent = thing.userData.type;
        }, 500);
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    // Update explosion particles
    explosionParticles.forEach(particle => {
        if (particle.visible) {
            particle.position.add(particle.userData.velocity);
            particle.rotation.x += particle.userData.rotationSpeed.x;
            particle.rotation.y += particle.userData.rotationSpeed.y;
            particle.rotation.z += particle.userData.rotationSpeed.z;
            
            particle.userData.life -= 0.015;
            particle.scale.setScalar(particle.userData.scale * particle.userData.life);
            particle.material.opacity = particle.userData.life;
            
            if (particle.userData.life <= 0) {
                particle.visible = false;
            }
        }
    });
    
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