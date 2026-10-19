import * as THREE from 'three';

const loadingEl = document.getElementById('loading');
const progressFillEl = document.getElementById('progress-fill');
const loadingStatusEl = document.getElementById('loading-status');
const loadingErrorEl = document.getElementById('loading-error');
const appEl = document.getElementById('app');

function setProgress(percent, status) {
  if (progressFillEl) progressFillEl.style.width = `${percent}%`;
  if (loadingStatusEl) loadingStatusEl.textContent = status;
}

function showError(message) {
  if (loadingErrorEl) {
    loadingErrorEl.textContent = message;
    loadingErrorEl.style.display = 'block';
  }
  if (loadingStatusEl) loadingStatusEl.textContent = 'Failed to start';
}

try {
  console.log(`VoxelCraft v${__VERSION__} built at ${__BUILD_TIME__}`);
  setProgress(20, 'Loading engine…');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(2.5, 2.5, 2.5);
  camera.lookAt(0, 0, 0);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({ color: 0x7fb238 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  appEl.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setProgress(90, 'Starting renderer…');

  let firstFrame = true;

  renderer.setAnimationLoop(() => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      setProgress(100, 'Ready');
      if (loadingEl) loadingEl.style.display = 'none';
      if (appEl) appEl.style.display = 'block';
    }
  });
} catch (err) {
  showError(err.message);
  throw err;
}
