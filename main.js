let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

let cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.set(0, 0, 5);
cam.lookAt(0, 0, 0);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas').appendChild(renderer.domElement);

let light = new THREE.AmbientLight(0x404040);
scene.add(light);

let sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(1, 1, 1);
scene.add(sun);

let stuff = [];
let shapes = [
    { name: 'ball', geo: new THREE.SphereGeometry(1, 32, 32) },
    { name: 'donut', geo: new THREE.TorusGeometry(1, 0.3, 16, 32) },
    { name: 'spiky', geo: new THREE.IcosahedronGeometry(1) },
    { name: 'diamond', geo: new THREE.OctahedronGeometry(1) },
    { name: 'pyramid', geo: new THREE.TetrahedronGeometry(1) },
    { name: 'd12', geo: new THREE.DodecahedronGeometry(1) }
];

let colors = [
    new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.2, metalness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.2, metalness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.2, metalness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.2, metalness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.2, metalness: 0.8 })
];

for (let i = 0; i < 6; i++) {
    let angle = (i / 6) * Math.PI * 2;
    let x = Math.cos(angle) * 3;
    let z = Math.sin(angle) * 3;

    let thing = new THREE.Mesh(shapes[i].geo, colors[i]);
    thing.position.set(x, 0, z);
    thing.userData = {
        type: shapes[i].name,
        spinning: false
    };
    scene.add(thing);
    stuff.push(thing);
}

let ray = new THREE.Raycaster();
let mouse = new THREE.Vector2();

window.addEventListener('resize', () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    ray.setFromCamera(mouse, cam);
    let hits = ray.intersectObjects(stuff);

    if (hits.length > 0) {
        let thing = hits[0].object;
        let now = shapes.findIndex(s => s.name === thing.userData.type);
        let next = (now + 1) % shapes.length;
        
        thing.geometry = shapes[next].geo;
        thing.userData.type = shapes[next].name;
        
        document.getElementById('shape').textContent = thing.userData.type;
        
        thing.userData.spinning = true;
        thing.scale.set(1.2, 1.2, 1.2);
        
        setTimeout(() => {
            thing.userData.spinning = false;
            thing.scale.set(1, 1, 1);
        }, 300);
    }
});

function go() {
    requestAnimationFrame(go);

    stuff.forEach(thing => {
        if (!thing.userData.spinning) {
            thing.rotation.x += 0.01;
            thing.rotation.y += 0.01;
        }
    });

    renderer.render(scene, cam);
}

go(); 