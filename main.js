window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector("a-scene");

    if (!scene.hasLoaded) {
        scene.addEventListener("loaded", () => {
            init();
        });
    } else {
        init();
    }

    function init() {
        const THREE = AFRAME.THREE;

        // Style setup
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
        background: white;
        box-shadow: 2px 0 8px rgba(0,0,0,0.2);
        padding: 1rem;
        transition: left 0.3s ease;
        z-index: 1000;
        pointer-events: auto;
      }

      #sideMenu.open { left: 0; }

      #textInput {
        width: 100%;
        height: 100px;
        font-size: 16px;
      }
      
      #clearButton, #clearLastButton {
        margin-top: 1rem;
        font-size: 1rem;
        padding: 0.5rem 1rem;
      }
    `;
        document.head.appendChild(style);

        const textInput = document.getElementById("textInput");
        let words = textInput.value.split(/\s+/).filter(w => w.length > 0);
        textInput.addEventListener("input", () => {
            words = textInput.value.split(/\s+/).filter(w => w.length > 0);
        });

        // Load external text corpus into textarea and word list
        fetch('/text.txt')
            .then(response => response.text())
            .then(text => {
                textInput.value = text;
                words = text.split(/\s+/).filter(w => w.length > 0);
            })
            .catch(err => console.error('Failed to load corpus.txt:', err));

        textInput.addEventListener("input", () => {
            words = textInput.value.split(/\s+/).filter(w => w.length > 0);
        });

        // Menu toggle
        const menu = document.getElementById("sideMenu");
        document.getElementById("menuToggle").addEventListener("click", () => {
            menu.classList.toggle("open");
        });

        // Clear all spawned words
        document.getElementById("clearButton").addEventListener("click", () => {
            const spawned = scene.querySelectorAll(".spawned-word");
            spawned.forEach(el => el.parentNode.removeChild(el));
            spawnedWords.length = 0;
        });

        // Clear last spawned word
        document.getElementById("clearLastButton").addEventListener("click", () => {
            const spawned = scene.querySelectorAll(".spawned-word");
            if (spawned.length === 0) return;
            const last = spawned[spawned.length - 1];
            last.parentNode.removeChild(last);
            spawnedWords.pop();
        });

        // Spawn word on scene click
        const spawnedWords = [];
        function getValidSpawnPosition(camera, existingPositions, maxAttempts = 10, minDistance = 0.25) {
            const THREE = AFRAME.THREE;
            const camPos = new THREE.Vector3();
            const camDir = new THREE.Vector3();
            camera.getWorldPosition(camPos);
            camera.getWorldDirection(camDir);

            for (let i = 0; i < maxAttempts; i++) {
                const dist = 2;
                const basePos = camPos.clone().add(camDir.clone().multiplyScalar(dist));

                // Add some random horizontal and vertical offset
                const offsetX = (Math.random() - 0.5) * 1.2; // ±0.6m
                const offsetY = (Math.random() - 0.5) * 1.2; // ±0.6m
                const spawnPos = basePos.clone().add(new THREE.Vector3(offsetX, offsetY, 0));

                // Check if it's far enough from existing positions
                const tooClose = existingPositions.some(pos => spawnPos.distanceTo(pos) < minDistance);
                if (!tooClose) return spawnPos;
            }

            return null; // No valid position found
        }

        // Then in your spawn handler replace spawn position calculation with:
        scene.addEventListener("click", (e) => {
            if (e.target.closest && e.target.closest("#sideMenu")) return;
            if (words.length === 0) return;

            const word = words[Math.floor(Math.random() * words.length)];
            const camera = scene.camera;

            const spawnPos = getValidSpawnPosition(camera, spawnedWords);
            if (!spawnPos) {
                console.log("No valid position found, word not spawned");
                return;
            }

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
    }
});
