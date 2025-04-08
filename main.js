const world = new THREE.Scene();
world.background = new THREE.Color(0x0a0a0a);

const view = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
view.position.set(0, 2, 7);

const canvas = new THREE.WebGLRenderer({ antialias: true });
canvas.setSize(window.innerWidth, window.innerHeight);
canvas.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas').appendChild(canvas.domElement);

const dot = document.createElement('div');
dot.style.cssText = `
    width: 20px;
    height: 20px;
    border: 2px solid #7d7dff;
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px #7d7dff;
`;
document.body.appendChild(dot);

const softLight = new THREE.AmbientLight(0x404040, 0.2);
world.add(softLight);

const mainLight = new THREE.DirectionalLight(0x7d7dff, 1.5);
mainLight.position.set(3, 4, 3);
world.add(mainLight);

const edgeLight = new THREE.DirectionalLight(0x7d7dff, 1.0);
edgeLight.position.set(-3, -2, -3);
world.add(edgeLight);

const backLight = new THREE.DirectionalLight(0x7d7dff, 0.8);
backLight.position.set(0, 0, -5);
world.add(backLight);

const sparkCount = 300;
const sparkGeo = new THREE.BufferGeometry();
const sparkPos = new Float32Array(sparkCount * 3);
const sparkMat = new THREE.PointsMaterial({
    color: 0x7d7dff,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const glowGeo = new THREE.BufferGeometry();
const glowPos = new Float32Array(sparkCount * 3);
const glowMat = new THREE.PointsMaterial({
    color: 0x7d7dff,
    size: 0.3,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

for (let i = 0; i < sparkCount; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    
    sparkPos[i * 3] = x;
    sparkPos[i * 3 + 1] = y;
    sparkPos[i * 3 + 2] = z;
    
    glowPos[i * 3] = x;
    glowPos[i * 3 + 1] = y;
    glowPos[i * 3 + 2] = z;
}

sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));

const sparks = new THREE.Points(sparkGeo, sparkMat);
const glows = new THREE.Points(glowGeo, glowMat);
world.add(sparks);
world.add(glows);

const forms = [
    { name: 'sphere', shape: new THREE.SphereGeometry(2, 64, 64) },
    { name: 'cube', shape: new THREE.BoxGeometry(2.5, 2.5, 2.5, 32, 32, 32) },
    { name: 'torus', shape: new THREE.TorusGeometry(2, 0.6, 32, 64) }
];

const spots = [
    { x: -6, z: -6 },
    { x: 0, z: -10 },
    { x: 6, z: -6 }
];

const purples = [
    0x8A2BE2, 
    0x9370DB, 
    0x9932CC  
];

function makeSurface(points, faces) {
    const patterns = [
        () => {
            const noise = Math.random() * 0.4;
            const wave = Math.sin(x * 2) * Math.cos(y * 2) * Math.sin(z * 2) * 0.2;
            const dent = Math.random() * 0.3;
            const ripple = Math.sin(Math.sqrt(x*x + y*y + z*z) * 3) * 0.15;
            return { noise, wave, dent, ripple };
        },
        () => {
            const noise = Math.random() * 0.2;
            const wave = Math.sin(x * 4) * Math.cos(y * 4) * Math.sin(z * 4) * 0.3;
            const dent = Math.random() * 0.2;
            const ripple = Math.sin(Math.sqrt(x*x + y*y + z*z) * 6) * 0.2;
            return { noise, wave, dent, ripple };
        },
        () => {
            const noise = Math.random() * 0.6;
            const wave = Math.sin(x * 1.5) * Math.cos(y * 1.5) * Math.sin(z * 1.5) * 0.1;
            const dent = Math.random() * 0.4;
            const ripple = Math.sin(Math.sqrt(x*x + y*y + z*z) * 2) * 0.1;
            return { noise, wave, dent, ripple };
        }
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    for (let j = 0; j < points.length; j += 3) {
        const x = points[j];
        const y = points[j + 1];
        const z = points[j + 2];
        
        const details = pattern();
        const crack = Math.random() > 0.95 ? Math.random() * 0.35 : 0;
        
        points[j] += x * details.noise + details.wave + details.dent + details.ripple + crack;
        points[j + 1] += y * details.noise + details.wave + details.dent + details.ripple + crack;
        points[j + 2] += z * details.noise + details.wave + details.dent + details.ripple + crack;
        
        const nx = faces[j];
        const ny = faces[j + 1];
        const nz = faces[j + 2];
        
        faces[j] += nx * details.noise * 0.7;
        faces[j + 1] += ny * details.noise * 0.7;
        faces[j + 2] += nz * details.noise * 0.7;
    }
}

function makeLook(color) {
    const looks = [
        () => new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 15,
            wireframe: false,
            emissive: color,
            emissiveIntensity: 0.1,
            flatShading: true,
            specular: 0x333333,
            roughness: 0.8,
            metalness: 0.3,
            bumpScale: 0.6
        }),
        () => new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 5,
            wireframe: false,
            emissive: color,
            emissiveIntensity: 0.2,
            flatShading: true,
            specular: 0x111111,
            roughness: 0.95,
            metalness: 0.1,
            bumpScale: 0.9
        }),
        () => new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 25,
            wireframe: false,
            emissive: color,
            emissiveIntensity: 0.05,
            flatShading: true,
            specular: 0x444444,
            roughness: 0.7,
            metalness: 0.4,
            bumpScale: 0.4
        })
    ];
    
    return looks[Math.floor(Math.random() * looks.length)]();
}

const stuff = [];
for (let i = 0; i < 3; i++) {
    const look = makeLook(purples[i]);
    const thing = new THREE.Mesh(forms[i].shape, look);
    thing.position.set(spots[i].x, 0, spots[i].z);
    
    const points = thing.geometry.attributes.position.array;
    const faces = thing.geometry.attributes.normal.array;
    makeSurface(points, faces);
    
    thing.geometry.attributes.position.needsUpdate = true;
    thing.geometry.attributes.normal.needsUpdate = true;
    thing.geometry.computeVertexNormals();
    
    thing.userData = {
        type: forms[i].name,
        startPos: {x: spots[i].x, y: 0, z: spots[i].z},
        spin: {x: Math.random() * 0.0005, y: Math.random() * 0.0005, z: Math.random() * 0.0005},
        size: 1,
        floatSpeed: Math.random() * 0.00005 + 0.00005,
        floatHeight: Math.random() * 0.05 + 0.05,
        pulseSpeed: Math.random() * 0.00005 + 0.00005,
        pulseAmount: Math.random() * 0.01 + 0.01,
        colorSpeed: Math.random() * 0.00005 + 0.00005,
        color: purples[i],
        targetSize: 1,
        morphProgress: 0,
        deformStrength: 0.3,
        deformRadius: 0.5,
        smoothFactor: 0.05,
        wobble: Math.random() * 0.1,
        stretch: 1,
        twist: 0
    };
    world.add(thing);
    stuff.push(thing);
}

const pointer = new THREE.Vector2();
const ray = new THREE.Raycaster();

const bits = [];
const maxBits = 200;

for (let i = 0; i < maxBits; i++) {
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });
    const bit = new THREE.Mesh(geo, mat);
    bit.visible = false;
    world.add(bit);
    bits.push(bit);
}

function makeBits(pos, col) {
    const activeBits = bits.filter(b => !b.visible);
    const count = Math.min(50, activeBits.length);
    
    for (let i = 0; i < count; i++) {
        const bit = activeBits[i];
        bit.position.copy(pos);
        bit.material.color.set(col);
        bit.userData = {
            move: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ),
            life: 1.0,
            size: 0.2 + Math.random() * 0.2,
            spin: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            )
        };
        bit.scale.set(1, 1, 1);
        bit.visible = true;
    }
}

const trailCount = 20;
const trails = [];
for (let i = 0; i < trailCount; i++) {
    const trail = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({
            color: 0x7d7dff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        })
    );
    trail.visible = false;
    world.add(trail);
    trails.push(trail);
}

let lastMousePos = new THREE.Vector2();
let trailIndex = 0;

const dynamicLight = new THREE.PointLight(0x7d7dff, 2, 10);
dynamicLight.position.set(0, 5, 0);
world.add(dynamicLight);

function pushShape(thing, point, strength) {
    const points = thing.geometry.attributes.position.array;
    const faces = thing.geometry.attributes.normal.array;
    
    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        
        const dist = Math.sqrt(
            Math.pow(x - point.x, 2) +
            Math.pow(y - point.y, 2) +
            Math.pow(z - point.z, 2)
        );
        
        if (dist < thing.userData.deformRadius) {
            const factor = (1 - dist / thing.userData.deformRadius) * strength;
            const nx = faces[i];
            const ny = faces[i + 1];
            const nz = faces[i + 2];
            
            points[i] += nx * factor;
            points[i + 1] += ny * factor;
            points[i + 2] += nz * factor;
        }
    }
    
    thing.geometry.attributes.position.needsUpdate = true;
    thing.geometry.computeVertexNormals();
}

function changeShape(thing, targetShape) {
    const startVertices = thing.geometry.attributes.position.array;
    const targetVertices = targetShape.attributes.position.array;
    const morphVertices = new Float32Array(startVertices.length);
    
    thing.userData.morphing = true;
    thing.userData.morphProgress = 0;
    thing.userData.morphVertices = morphVertices;
    thing.userData.startVertices = startVertices;
    thing.userData.targetVertices = targetVertices;
}

function wobbleShape(thing) {
    const points = thing.geometry.attributes.position.array;
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        
        const wobble = Math.sin(time + x * 2) * thing.userData.wobble;
        points[i] += wobble;
        points[i + 1] += wobble * 0.5;
        points[i + 2] += wobble * 0.3;
    }
    
    thing.geometry.attributes.position.needsUpdate = true;
    thing.geometry.computeVertexNormals();
}

function stretchShape(thing) {
    const points = thing.geometry.attributes.position.array;
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        
        const stretch = Math.sin(time) * 0.1;
        points[i] *= 1 + stretch;
        points[i + 1] *= 1 - stretch * 0.5;
        points[i + 2] *= 1 + stretch * 0.3;
    }
    
    thing.geometry.attributes.position.needsUpdate = true;
    thing.geometry.computeVertexNormals();
}

function twistShape(thing) {
    const points = thing.geometry.attributes.position.array;
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        
        const angle = time + y * 0.5;
        const twist = Math.sin(angle) * 0.2;
        
        const newX = x * Math.cos(twist) - z * Math.sin(twist);
        const newZ = x * Math.sin(twist) + z * Math.cos(twist);
        
        points[i] = newX;
        points[i + 2] = newZ;
    }
    
    thing.geometry.attributes.position.needsUpdate = true;
    thing.geometry.computeVertexNormals();
}

window.addEventListener('mousemove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    
    ray.setFromCamera(pointer, view);
    const hits = ray.intersectObjects(stuff);
    
    if (hits.length > 0) {
        const thing = hits[0].object;
        const point = hits[0].point;
        pushShape(thing, point, thing.userData.deformStrength * 0.05);
    }
    
    stuff.forEach(thing => {
        const dist = Math.sqrt(
            Math.pow(thing.position.x - (pointer.x * 8), 2) + 
            Math.pow(thing.position.z - (pointer.y * 8), 2)
        );
        
        thing.rotation.x += thing.userData.spin.x;
        thing.rotation.y += thing.userData.spin.y;
        thing.rotation.z += thing.userData.spin.z;
        
        const pulse = Math.sin(Date.now() * thing.userData.pulseSpeed) * thing.userData.pulseAmount;
        const targetSize = 1 + 0.2 / dist + pulse;
        thing.userData.size += (targetSize - thing.userData.size) * thing.userData.smoothFactor;
        thing.scale.set(thing.userData.size, thing.userData.size, thing.userData.size);
        
        thing.position.y = Math.sin(Date.now() * thing.userData.floatSpeed + i) * thing.userData.floatHeight;
        
        const col = new THREE.Color(thing.userData.color);
        const bright = 0.5 + Math.sin(Date.now() * thing.userData.colorSpeed) * 0.1;
        col.offsetHSL(0, 0, bright - 0.5);
        thing.material.color = col;
        thing.material.emissive = col;
        thing.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
    });

    const currentMousePos = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
    );

    if (lastMousePos.distanceTo(currentMousePos) > 0.005) {
        const trail = trails[trailIndex];
        trail.position.set(
            currentMousePos.x * 8,
            0,
            currentMousePos.y * 8
        );
        trail.visible = true;
        trail.userData = {
            life: 1.0,
            scale: 0.1 + Math.random() * 0.1
        };
        trail.scale.setScalar(trail.userData.scale);
        
        trailIndex = (trailIndex + 1) % trailCount;
        lastMousePos.copy(currentMousePos);
    }

    dynamicLight.position.x = currentMousePos.x * 5;
    dynamicLight.position.z = currentMousePos.y * 5;
    dynamicLight.intensity = 2 + Math.sin(Date.now() * 0.001) * 0.5;
});

window.addEventListener('click', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    ray.setFromCamera(pointer, view);
    const hits = ray.intersectObjects(stuff);
    
    if (hits.length > 0) {
        const thing = hits[0].object;
        const point = hits[0].point;
        pushShape(thing, point, thing.userData.deformStrength);
        
        const now = forms.findIndex(f => f.name === thing.userData.type);
        const next = (now + 1) % forms.length;
        
        makeBits(thing.position.clone(), thing.material.color);
        
        changeShape(thing, forms[next].shape);
        
        setTimeout(() => {
            thing.geometry = forms[next].shape;
            thing.material = makeLook(thing.userData.color);
            const points = thing.geometry.attributes.position.array;
            const faces = thing.geometry.attributes.normal.array;
            makeSurface(points, faces);
            thing.geometry.attributes.position.needsUpdate = true;
            thing.geometry.attributes.normal.needsUpdate = true;
            thing.geometry.computeVertexNormals();
            
            thing.userData.type = forms[next].name;
            thing.userData.spin = {
                x: Math.random() * 0.002,
                y: Math.random() * 0.002,
                z: Math.random() * 0.002
            };
            thing.userData.pulseSpeed = Math.random() * 0.0001 + 0.0001;
            thing.userData.pulseAmount = Math.random() * 0.02 + 0.02;
            thing.userData.colorSpeed = Math.random() * 0.0001 + 0.0001;
            thing.userData.wobble = Math.random() * 0.1;
            document.getElementById('shape').textContent = thing.userData.type;
        }, 1500);
    }
});

function draw() {
    requestAnimationFrame(draw);
    
    trails.forEach(trail => {
        if (trail.visible) {
            trail.userData.life -= 0.01;
            trail.material.opacity = trail.userData.life;
            trail.scale.setScalar(trail.userData.scale * trail.userData.life);
            
            if (trail.userData.life <= 0) {
                trail.visible = false;
            }
        }
    });

    stuff.forEach(thing => {
        if (thing.userData.morphing) {
            thing.userData.morphProgress += 0.005;
            if (thing.userData.morphProgress >= 1) {
                thing.userData.morphing = false;
            } else {
                const vertices = thing.geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i++) {
                    vertices[i] = THREE.MathUtils.lerp(
                        thing.userData.startVertices[i],
                        thing.userData.targetVertices[i],
                        thing.userData.morphProgress
                    );
                }
                thing.geometry.attributes.position.needsUpdate = true;
                thing.geometry.computeVertexNormals();
            }
        }
    });
    
    bits.forEach(bit => {
        if (bit.visible) {
            bit.position.add(bit.userData.move);
            bit.rotation.x += bit.userData.spin.x;
            bit.rotation.y += bit.userData.spin.y;
            bit.rotation.z += bit.userData.spin.z;
            
            bit.userData.life -= 0.005;
            bit.scale.setScalar(bit.userData.size * bit.userData.life);
            bit.material.opacity = bit.userData.life;
            
            if (bit.userData.life <= 0) {
                bit.visible = false;
            }
        }
    });
    
    stuff.forEach(thing => {
        if (thing.userData.morphing) {
            thing.userData.morphProgress += 0.005;
            if (thing.userData.morphProgress >= 1) {
                thing.userData.morphing = false;
            }
            
            const size = 1 + Math.sin(thing.userData.morphProgress * Math.PI) * 0.1;
            thing.scale.set(size, size, size);
        }
        
        thing.rotation.x += thing.userData.spin.x;
        thing.rotation.y += thing.userData.spin.y;
        thing.rotation.z += thing.userData.spin.z;
        
        const pulse = Math.sin(Date.now() * thing.userData.pulseSpeed) * thing.userData.pulseAmount;
        thing.userData.targetSize = 1 + pulse;
        thing.userData.size += (thing.userData.targetSize - thing.userData.size) * thing.userData.smoothFactor;
        thing.scale.set(thing.userData.size, thing.userData.size, thing.userData.size);
        
        thing.position.y = Math.sin(Date.now() * thing.userData.floatSpeed) * thing.userData.floatHeight;
        
        const col = new THREE.Color(thing.userData.color);
        const bright = 0.5 + Math.sin(Date.now() * thing.userData.colorSpeed) * 0.05;
        col.offsetHSL(0, 0, bright - 0.5);
        thing.material.color = col;
        thing.material.emissive = col;
        thing.material.emissiveIntensity = 0.05 + Math.sin(Date.now() * 0.0005) * 0.01;

        wobbleShape(thing);
        stretchShape(thing);
        twistShape(thing);
    });
    
    const sparkPos = sparkGeo.attributes.position.array;
    const glowPos = glowGeo.attributes.position.array;
    
    for (let i = 0; i < sparkCount; i++) {
        sparkPos[i * 3 + 1] += 0.01;
        glowPos[i * 3 + 1] += 0.01;
        
        if (sparkPos[i * 3 + 1] > 10) {
            sparkPos[i * 3 + 1] = -10;
            glowPos[i * 3 + 1] = -10;
        }
    }
    
    sparkGeo.attributes.position.needsUpdate = true;
    glowGeo.attributes.position.needsUpdate = true;
    
    canvas.render(world, view);
}

draw(); 