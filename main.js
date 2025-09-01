// main.js
window.addEventListener('DOMContentLoaded', async () => {

    const fallback = document.getElementById('fallback');

    // --- Detect mobile/tablet ---
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
        // Desktop → show fallback, stop running AR code
        if (fallback) fallback.style.display = 'flex';
        return; // exit main.js early, no camera access
    }

    // Mobile → hide fallback
    if (fallback) fallback.style.display = 'none';

    // --- Wait for the dynamically injected AR scene ---
    async function getScene() {
        return new Promise(resolve => {
            const check = () => {
                const s = document.getElementById('xrScene');
                if (s) resolve(s);
                else requestAnimationFrame(check);
            };
            check();
        });
    }

    const scene = await getScene();
    console.log('Scene ready:', scene);

    const THREE = AFRAME.THREE;

    // --- Style setup for side menu ---
    const style = document.createElement('style');
    style.textContent = `
    body { margin: 0; overflow: hidden; font-family: sans-serif; }

    #menuToggle {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 1001;
      padding: 0.5rem 1rem;
      background: #333;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    #sideMenu {
      position: fixed;
      top: 0;
      left: -320px;
      width: 300px;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);      box-shadow: 2px 0 8px rgba(0,0,0,0.2);
      padding: 1rem;
      transition: left 0.3s ease;
      z-index: 1000;
      pointer-events: auto;
    }

    #sideMenu.open { left: 0; }

    #textInput { width: 100%; height: 100px; font-size: 16px; background: rgba(255, 255, 255, 0.4); }
    #clearButton, #clearLastButton { margin-top: 1rem; font-size: 1rem; padding: 0.5rem 1rem; }
  `;
    document.head.appendChild(style);

    // --- Word list ---
    const textInput = document.getElementById("textInput");
    let words = textInput.value.split(/\s+/).filter(w => w.length > 0);

    textInput.addEventListener("input", () => {
        words = textInput.value.split(/\s+/).filter(w => w.length > 0);
    });

    // Load external corpus (optional)
    fetch('/text.txt')
        .then(res => res.text())
        .then(text => {
            textInput.value = text;
            words = text.split(/\s+/).filter(w => w.length > 0);
        })
        .catch(err => console.warn('Failed to load corpus.txt:', err));

    // --- Side menu toggle ---
    const menu = document.getElementById("sideMenu");
    document.getElementById("menuToggle").addEventListener("click", () => {
        menu.classList.toggle("open");
    });

    // --- Word spawning ---
    const spawnedWords = [];

    function getValidSpawnPosition(camera, existingPositions, maxAttempts = 25, minDistance = 0.10) {
        const camPos = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        camera.getWorldPosition(camPos);
        camera.getWorldDirection(camDir);

        for (let i = 0; i < maxAttempts; i++) {
            const dist = 2;
            const basePos = camPos.clone().add(camDir.clone().multiplyScalar(dist));

            const offsetX = (Math.random() - 0.5) * 1.2;
            const offsetY = (Math.random() - 0.5) * 1.2;
            const spawnPos = basePos.clone().add(new THREE.Vector3(offsetX, offsetY, 0));

            const tooClose = existingPositions.some(pos => spawnPos.distanceTo(pos) < minDistance);
            if (!tooClose) return spawnPos;
        }
        return null;
    }

    scene.addEventListener("pointerdown", e => {
        if (e.target.closest && e.target.closest("#sideMenu")) return;
        if (words.length === 0) return;

        const word = words[Math.floor(Math.random() * words.length)];
        const camera = scene.camera;

        const spawnPos = getValidSpawnPosition(camera, spawnedWords);
        if (!spawnPos) return;

        spawnedWords.push(spawnPos.clone());

        const wrapper = document.createElement("a-entity");
        wrapper.setAttribute("position", `${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`);
        wrapper.setAttribute("class", "spawned-word");
        wrapper.object3D.lookAt(camera.position);

        const textEl = document.createElement("a-entity");
        textEl.setAttribute("text", {
            value: word,
            align: "center",
            color: "black",
            width: 3,
            opacity: 0
        });

        textEl.setAttribute("animation__fade", {
            property: "text.opacity",
            from: 0,
            to: 1,
            dur: 800,
            easing: "easeOutQuad"
        });

        wrapper.appendChild(textEl);
        scene.appendChild(wrapper);
    });

    // --- Clear buttons ---
    document.getElementById("clearButton").addEventListener("click", () => {
        const spawned = scene.querySelectorAll(".spawned-word");
        spawned.forEach(el => el.remove());
        spawnedWords.length = 0;
    });

    document.getElementById("clearLastButton").addEventListener("click", () => {
        const spawned = scene.querySelectorAll(".spawned-word");
        if (!spawned.length) return;
        spawned[spawned.length - 1].remove();
        spawnedWords.pop();
    });

    // --- Touch / gesture helpers ---
    function getDistance(t1, t2) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }

    function getAngle(t1, t2) {
        return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
    }

    function findClosestWord(x, y, words) {
        const mouse = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, scene.camera);

        let closest = null, minDist = Infinity;
        for (const el of words) {
            const pos = new THREE.Vector3();
            el.object3D.getWorldPosition(pos);
            const dist = raycaster.ray.origin.distanceTo(pos);
            if (dist < minDist) { minDist = dist; closest = el; }
        }
        // return closest;
        return words[words.length - 1];
    }

    let activeWord = null, initialDist = 0, initialAngle = 0, initialScale = 1, initialRotation = 0;

    let initialMid = { x: 0, y: 0 };
    let initialRotationX = 0;
    let initialRotationY = 0;

    window.addEventListener("touchstart", e => {
        if (e.touches.length === 2) {
            const [t1, t2] = e.touches;
            const midX = (t1.clientX + t2.clientX) / 2;
            const midY = (t1.clientY + t2.clientY) / 2;

            const spawned = scene.querySelectorAll(".spawned-word");
            activeWord = findClosestWord(midX, midY, spawned);
            // activeWord = spawnedWords[spawnedWords.length - 1]; // <-- last added word

            if (activeWord) {
                initialDist = getDistance(t1, t2);
                initialAngle = getAngle(t1, t2);
                initialScale = activeWord.object3D.scale.x;
                initialRotation = activeWord.object3D.rotation.z;

                initialMid = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 };
                initialRotationX = activeWord.object3D.rotation.x;
                initialRotationY = activeWord.object3D.rotation.y;
            }
        }
    });

    window.addEventListener("touchmove", e => {
        if (e.touches.length === 2 && activeWord) {
            const [t1, t2] = e.touches;

            // --- Scaling ---
            const newDist = getDistance(t1, t2);
            activeWord.object3D.scale.setScalar(initialScale * (newDist / initialDist));

            // --- Rotation ---
            const newAngle = getAngle(t1, t2);
            activeWord.object3D.rotation.z = initialRotation - (newAngle - initialAngle); // twist

            // Midpoint movement for X/Y rotation
            const mid = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 };
            const dx = mid.x - initialMid.x;
            const dy = mid.y - initialMid.y;

            activeWord.object3D.rotation.x = initialRotationX - dy * 0.01; // up/down → X
            activeWord.object3D.rotation.y = initialRotationY + dx * 0.01; // left/right → Y
        }

        if (e.touches.length === 1) e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchend", e => {
        if (e.touches.length < 2) activeWord = null;
    });

    // --- Mouse drag prevention ---
    let dragging = false;
    window.addEventListener("mousedown", e => e.button === 0 && (dragging = true));
    window.addEventListener("mousemove", e => dragging && e.preventDefault(), { passive: false });
    window.addEventListener("mouseup", () => dragging = false);

});
