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

const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0x7d7dff, 1.2);
sun.position.set(2, 3, 2);
scene.add(sun);

const rimLight = new THREE.DirectionalLight(0x7d7dff, 0.8);
rimLight.position.set(-2, -1, -2);
scene.add(rimLight);

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
    { name: 'cube', geo: new THREE.BoxGeometry(2.5, 2.5, 2.5, 32, 32, 32) },
    { name: 'torus', geo: new THREE.TorusGeometry(2, 0.6, 32, 64) }
];

const gridPositions = [
    { x: -6, z: -6 },
    { x: 0, z: -10 },
    { x: 6, z: -6 }
];

const purpleShades = [
    0x8A2BE2, 
    0x9370DB, 
    0x9932CC  
];

const stuff = [];
for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshPhongMaterial({ 
        color: purpleShades[i],
        shininess: 20,
        wireframe: false,
        emissive: purpleShades[i],
        emissiveIntensity: 0.1,
        flatShading: true,
        specular: 0x222222,
        roughness: 0.9,
        metalness: 0.2
    });

    const thing = new THREE.Mesh(shapes[i].geo, material);
    thing.position.set(gridPositions[i].x, 0, gridPositions[i].z);
    
    const vertices = thing.geometry.attributes.position.array;
    for (let j = 0; j < vertices.length; j += 3) {
        const x = vertices[j];
        const y = vertices[j + 1];
        const z = vertices[j + 2];
        
        const noise = Math.random() * 0.2;
        const wave = Math.sin(x * 2) * Math.cos(y * 2) * Math.sin(z * 2) * 0.1;
        const dent = Math.random() * 0.15;
        
        vertices[j] += x * noise + wave + dent;
        vertices[j + 1] += y * noise + wave + dent;
        vertices[j + 2] += z * noise + wave + dent;
    }
    thing.geometry.attributes.position.needsUpdate = true;
    thing.geometry.computeVertexNormals();
    
    thing.userData = {
        type: shapes[i].name,
        originalPos: {x: gridPositions[i].x, y: 0, z: gridPositions[i].z},
        rotationSpeed: {x: Math.random() * 0.003, y: Math.random() * 0.003, z: Math.random() * 0.003},
        scale: 1,
        floatSpeed: Math.random() * 0.0002 + 0.0002,
        floatHeight: Math.random() * 0.15 + 0.15,
        pulseSpeed: Math.random() * 0.0002 + 0.0002,
        pulseAmount: Math.random() * 0.03 + 0.03,
        colorSpeed: Math.random() * 0.0002 + 0.0002,
        baseColor: purpleShades[i],
        targetScale: 1,
        morphProgress: 0
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
        
        createExplosion(thing.position.clone(), thing.material.color);
        
        thing.userData.morphing = true;
        thing.userData.morphProgress = 0;
        thing.userData.nextShape = next;
        
        setTimeout(() => {
            thing.geometry = shapes[next].geo;
            thing.userData.type = shapes[next].name;
            thing.userData.rotationSpeed = {
                x: Math.random() * 0.005,
                y: Math.random() * 0.005,
                z: Math.random() * 0.005
            };
            thing.userData.pulseSpeed = Math.random() * 0.0003 + 0.0003;
            thing.userData.pulseAmount = Math.random() * 0.05 + 0.05;
            thing.userData.colorSpeed = Math.random() * 0.0003 + 0.0003;
            document.getElementById('shape').textContent = thing.userData.type;
        }, 1000);
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    explosionParticles.forEach(particle => {
        if (particle.visible) {
            particle.position.add(particle.userData.velocity);
            particle.rotation.x += particle.userData.rotationSpeed.x;
            particle.rotation.y += particle.userData.rotationSpeed.y;
            particle.rotation.z += particle.userData.rotationSpeed.z;
            
            particle.userData.life -= 0.01;
            particle.scale.setScalar(particle.userData.scale * particle.userData.life);
            particle.material.opacity = particle.userData.life;
            
            if (particle.userData.life <= 0) {
                particle.visible = false;
            }
        }
    });
    
    stuff.forEach(thing => {
        if (thing.userData.morphing) {
            thing.userData.morphProgress += 0.01;
            if (thing.userData.morphProgress >= 1) {
                thing.userData.morphing = false;
            }
            
            const scale = 1 + Math.sin(thing.userData.morphProgress * Math.PI) * 0.2;
            thing.scale.set(scale, scale, scale);
        }
        
        thing.rotation.x += thing.userData.rotationSpeed.x;
        thing.rotation.y += thing.userData.rotationSpeed.y;
        thing.rotation.z += thing.userData.rotationSpeed.z;
        
        const pulse = Math.sin(Date.now() * thing.userData.pulseSpeed) * thing.userData.pulseAmount;
        thing.userData.targetScale = 1 + pulse;
        thing.userData.scale += (thing.userData.targetScale - thing.userData.scale) * 0.05;
        thing.scale.set(thing.userData.scale, thing.userData.scale, thing.userData.scale);
        
        thing.position.y = Math.sin(Date.now() * thing.userData.floatSpeed) * thing.userData.floatHeight;
        
        const color = new THREE.Color(thing.userData.baseColor);
        const brightness = 0.5 + Math.sin(Date.now() * thing.userData.colorSpeed) * 0.1;
        color.offsetHSL(0, 0, brightness - 0.5);
        thing.material.color = color;
        thing.material.emissive = color;
        thing.material.emissiveIntensity = 0.1 + Math.sin(Date.now() * 0.001) * 0.05;
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