/**
 * SB Infra - Background 3D Scene
 * Implements a professional civil construction 3D visualization
 */

document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Create container for 3D canvas
    const container = document.createElement('div');
    container.id = 'hero-3d-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '0';
    container.style.pointerEvents = 'none';
    hero.insertBefore(container, hero.firstChild);

    // Three.js Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Match site dark theme

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting - Natural Daylight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); // Sky and Ground color
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const daylight = new THREE.DirectionalLight(0xfffaf0, 0.8); // Warm daylight
    daylight.position.set(10, 20, 10);
    daylight.castShadow = true;
    daylight.shadow.mapSize.width = 2048;
    daylight.shadow.mapSize.height = 2048;
    scene.add(daylight);

    // Materials
    const concreteMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.8,
        metalness: 0.0
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.8
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.3
    });

    const craneMaterial = new THREE.MeshStandardMaterial({
        color: 0xe6b325, // SB Infra Gold
        roughness: 0.5,
        metalness: 0.5
    });

    // Scene Content - Professional Civil Construction Site
    const group = new THREE.Group();
    scene.add(group);

    // Ground Plane (Subtle)
    const grid = new THREE.GridHelper(50, 50, 0x333333, 0x222222);
    grid.position.y = -4;
    scene.add(grid);

    // Building Structure
    const buildStructure = () => {
        // Foundation
        const baseGeo = new THREE.BoxGeometry(8, 0.5, 8);
        const base = new THREE.Mesh(baseGeo, concreteMaterial);
        base.position.y = -3.75;
        base.receiveShadow = true;
        group.add(base);

        // Columns
        const colGeo = new THREE.BoxGeometry(0.5, 8, 0.5);
        for (let x = -3; x <= 3; x += 6) {
            for (let z = -3; z <= 3; z += 6) {
                const col = new THREE.Mesh(colGeo, concreteMaterial);
                col.position.set(x, 0, z);
                col.castShadow = true;
                group.add(col);
            }
        }

        // Slab
        const slabGeo = new THREE.BoxGeometry(8, 0.4, 8);
        const slab = new THREE.Mesh(slabGeo, concreteMaterial);
        slab.position.y = 4;
        slab.castShadow = true;
        slab.receiveShadow = true;
        group.add(slab);

        // Steel reinforcement grid (top)
        const rebarGeo = new THREE.BoxGeometry(8, 0.05, 0.05);
        for (let i = -3.5; i <= 3.5; i += 0.5) {
            const r1 = new THREE.Mesh(rebarGeo, steelMaterial);
            r1.position.set(0, 4.3, i);
            group.add(r1);

            const r2 = new THREE.Mesh(rebarGeo, steelMaterial);
            r2.position.set(i, 4.3, 0);
            r2.rotation.y = Math.PI / 2;
            group.add(r2);
        }

        // Crane
        const craneGroup = new THREE.Group();
        craneGroup.position.set(-6, -4, -6);

        // Tower
        const towerGeo = new THREE.BoxGeometry(0.8, 15, 0.8);
        const tower = new THREE.Mesh(towerGeo, craneMaterial);
        tower.position.y = 7.5;
        tower.castShadow = true;
        craneGroup.add(tower);

        // Jib
        const jibGeo = new THREE.BoxGeometry(12, 0.5, 0.5);
        const jib = new THREE.Mesh(jibGeo, craneMaterial);
        jib.position.set(4, 15, 0);
        craneGroup.add(jib);

        group.add(craneGroup);
    };

    buildStructure();

    camera.position.z = 12;
    camera.position.y = 3;
    camera.lookAt(0, 1, 0);

    // Animation Parameters
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    // Slow and stable movement
    const animate = () => {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.0002; // Very slow animation

        // Natural floating movement
        group.rotation.y += 0.001;
        group.position.y = Math.sin(time) * 0.5;

        // Subtle camera response to scroll (simulated here)
        const scrollY = window.scrollY;
        camera.position.y = 3 + scrollY * 0.005;
        camera.lookAt(0, 1 - scrollY * 0.002, 0);

        renderer.render(scene, camera);
    };

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
});
