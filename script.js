// ===== DONNÉES FRANÇAISES =====
const frenchCities = [
    { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'Île-de-France' },
    { name: 'Marseille', lat: 43.2965, lon: 5.3698, region: 'Provence' },
    { name: 'Lyon', lat: 45.7640, lon: 4.8357, region: 'Rhône-Alpes' },
    { name: 'Toulouse', lat: 43.6047, lon: 1.4442, region: 'Occitanie' },
    { name: 'Nice', lat: 43.7102, lon: 7.2620, region: 'Côte d\'Azur' },
    { name: 'Nantes', lat: 47.2184, lon: -1.5536, region: 'Loire-Atlantique' },
    { name: 'Strasbourg', lat: 48.5734, lon: 7.7521, region: 'Alsace' },
    { name: 'Montpellier', lat: 43.6108, lon: 3.8767, region: 'Occitanie' },
    { name: 'Bordeaux', lat: 44.8378, lon: -0.5792, region: 'Nouvelle-Aquitaine' },
    { name: 'Lille', lat: 50.6292, lon: 3.0573, region: 'Nord-Pas-de-Calais' },
    { name: 'Rennes', lat: 48.1113, lon: -1.6800, region: 'Bretagne' },
    { name: 'Reims', lat: 49.2583, lon: 4.0347, region: 'Champagne' },
    { name: 'Le Havre', lat: 49.4944, lon: 0.1079, region: 'Normandie' },
    { name: 'Saint-Étienne', lat: 45.4399, lon: 4.3890, region: 'Loire' },
    { name: 'Toulon', lat: 43.1256, lon: 5.9305, region: 'Provence' },
    { name: 'Grenoble', lat: 45.1885, lon: 5.7245, region: 'Rhône-Alpes' },
    { name: 'Dijon', lat: 47.3220, lon: 5.0447, region: 'Bourgogne' },
    { name: 'Angers', lat: 47.4711, lon: -0.5549, region: 'Pays de la Loire' },
    { name: 'Villeurbanne', lat: 45.7673, lon: 4.8842, region: 'Rhône-Alpes' },
    { name: 'Metz', lat: 49.1193, lon: 6.1757, region: 'Lorraine' }
];

const internationalCities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060, region: 'USA' },
    { name: 'Londres', lat: 51.5074, lon: -0.1278, region: 'UK' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'Japon' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'Australie' },
    { name: 'Singapour', lat: 1.3521, lon: 103.8198, region: 'Singapour' },
    { name: 'Dubaï', lat: 25.2048, lon: 55.2708, region: 'EAU' },
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, region: 'Brésil' },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, region: 'Canada' },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, region: 'Allemagne' },
    { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, region: 'Pays-Bas' }
];

const allCities = [...frenchCities, ...internationalCities];

// ===== THREE.JS SETUP =====
let scene, camera, renderer, globe, points = [];
let stats = {
    total: 0,
    active: 0,
    rps: 0,
    lastMinuteRequests: []
};

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    const canvas = document.getElementById('globeCanvas');
    camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0);

    // Globe
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        color: 0x1a4d7a,
        emissive: 0x0a2540,
        wireframe: false,
        shininess: 5
    });
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x64c8ff, 0.8);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // Grille de latitude/longitude
    const gridGeometry = new THREE.BufferGeometry();
    const gridPoints = [];

    for (let lat = -80; lat <= 80; lat += 20) {
        for (let lon = -180; lon <= 180; lon += 20) {
            const phi = (90 - lat) * Math.PI / 180;
            const theta = (lon + 180) * Math.PI / 180;
            
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);
            
            gridPoints.push(x, y, z);
        }
    }

    gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridPoints), 3));
    const gridMaterial = new THREE.PointsMaterial({ color: 0x00ff88, size: 0.01 });
    const grid = new THREE.Points(gridGeometry, gridMaterial);
    scene.add(grid);

    // Animation loop
    animate();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotation du globe
    globe.rotation.y += 0.0002;

    // Animer les points
    points.forEach((point, index) => {
        point.scale.x *= 0.98;
        point.scale.y *= 0.98;
        point.scale.z *= 0.98;
        point.material.opacity *= 0.98;

        if (point.scale.x < 0.05) {
            scene.remove(point);
            points.splice(index, 1);
            stats.active--;
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    const canvas = document.getElementById('globeCanvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function latLonToVector3(lat, lon) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;

    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z).normalize();
}

function addRequestPoint(lat, lon, color = 0x00ff88) {
    const position = latLonToVector3(lat, lon).multiplyScalar(1.05);

    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
        emissive: color,
        emissiveIntensity: 0.8
    });

    const point = new THREE.Mesh(geometry, material);
    point.position.copy(position);

    scene.add(point);
    points.push(point);
    stats.active++;
}

// ===== SIMULATION DES REQUÊTES =====
function generateRandomRequest() {
    const city = allCities[Math.floor(Math.random() * allCities.length)];
    const color = frenchCities.includes(city) ? 0x00ff88 : 0x64c8ff;
    
    addRequestPoint(city.lat, city.lon, color);
    stats.total++;

    // Add to log
    addLogEntry(city.name, city.region);

    // Update stats
    updateStats();
}

function startRequestSimulation() {
    // Générer 40-200 requêtes par minute (0.67 à 3.33 par seconde)
    setInterval(() => {
        const requestsPerSecond = Math.random() * 2.66 + 0.67; // 40-200 par minute
        const requestsThisSecond = Math.floor(requestsPerSecond);

        for (let i = 0; i < requestsThisSecond; i++) {
            generateRandomRequest();
        }
    }, 1000);

    // Update RPS counter
    setInterval(() => {
        const now = Date.now();
        stats.lastMinuteRequests = stats.lastMinuteRequests.filter(t => now - t < 60000);
        stats.rps = stats.lastMinuteRequests.length;
        document.getElementById('rpsValue').textContent = stats.rps;
    }, 1000);
}

// ===== UI UPDATES =====
function addLogEntry(city, region) {
    const logList = document.getElementById('logList');
    
    // Remove empty message
    const emptyMsg = logList.querySelector('.empty-log');
    if (emptyMsg) emptyMsg.remove();

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const time = new Date().toLocaleTimeString('fr-FR');
    entry.innerHTML = `
        <div class="log-location">📍 ${city}</div>
        <div class="log-time">${region} • ${time}</div>
    `;

    logList.insertBefore(entry, logList.firstChild);

    // Keep only last 20 entries
    while (logList.children.length > 20) {
        logList.removeChild(logList.lastChild);
    }

    // Track for RPS
    stats.lastMinuteRequests.push(Date.now());
}

function updateStats() {
    document.getElementById('totalValue').textContent = stats.total;
    document.getElementById('activeValue').textContent = stats.active;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    startRequestSimulation();
    updateStats();

    // Hide loading indicator
    setTimeout(() => {
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }, 500);
});
