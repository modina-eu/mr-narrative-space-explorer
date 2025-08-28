window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector("a-scene");

    // Wait for A-Frame to finish loading the scene
    if (!scene.hasLoaded) {
        scene.addEventListener("loaded", () => {
            init();
        });
    } else {
        init();
    }

    function init() {
        const THREE = AFRAME.THREE;

        // Style setup (if no external CSS)
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
    `;
        document.head.appendChild(style);

        const textInput = document.getElementById("textInput");
        let words = textInput.value.split(/\s+/).filter(w => w.length > 0);
        textInput.addEventListener("input", () => {
            words = textInput.value.split(/\s+/).filter(w => w.length > 0);
        });

        // Menu toggle
        const menu = document.getElementById("sideMenu");
        document.getElementById("menuToggle").addEventListener("click", () => {
            menu.classList.toggle("open");
        });

        let selected = null;
        let isDragging = false;
        let initialPinchDistance = null;
        let initialZ = null;
        let initialAngle = null;
        let initialRotationY = null;

        // Spawn words on click
        scene.addEventListener("click", (e) => {
            console.log("Scene clicked");

            if (e.target.closest && e.target.closest("#sideMenu")) return;
            if (words.length === 0) {
                console.warn("Word list is empty");
                return;
            }

            const word = words[Math.floor(Math.random() * words.length)];

            const camera = scene.camera;
            if (!camera) {
                console.warn("Camera not ready yet");
                return;
            }

            const camPos = new THREE.Vector3();
            const camDir = new THREE.Vector3();
            camera.getWorldPosition(camPos);
            camera.getWorldDirection(camDir);

            // DEBUG: fixed visible position in front of camera
            camDir.multiplyScalar(2);
            const spawnPos = camPos.clone().add(camDir);

            const wrapper = document.createElement("a-entity");
            wrapper.setAttribute("position", `${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`);

            const textEl = document.createElement("a-entity");
            textEl.setAttribute("text", {
                value: word,
                align: "center",
                color: "red", // bright red for visibility
                width: 3
            });

            const box = document.createElement("a-box");
            box.setAttribute("scale", "3 1.5 0.2");
            box.setAttribute("material", "opacity:0; transparent:true");
            box.classList.add("collider");

            wrapper.appendChild(textEl);
            wrapper.appendChild(box);
            wrapper.object3D.lookAt(camPos);
            scene.appendChild(wrapper);

            box.addEventListener("mousedown", () => selectWord(wrapper, textEl));
            box.addEventListener("touchstart", () => selectWord(wrapper, textEl));
        });

        function selectWord(wrapper, textEl) {
            selected = wrapper.object3D;
            selected.textEl = textEl;
            isDragging = true;
            textEl.setAttribute("text", "color", "blue");
        }

        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane();
        const mouse = new THREE.Vector2();

        function updateMouse(evt) {
            if (evt.touches && evt.touches.length === 1) {
                mouse.x = (evt.touches[0].clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(evt.touches[0].clientY / window.innerHeight) * 2 + 1;
            } else if (!evt.touches) {
                mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
            }
        }

        function moveSelected(evt) {
            if (!isDragging || !selected) return;

            if (evt.touches && evt.touches.length === 2) {
                const dx = evt.touches[0].clientX - evt.touches[1].clientX;
                const dy = evt.touches[0].clientY - evt.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                if (initialPinchDistance === null) {
                    initialPinchDistance = dist;
                    initialZ = selected.position.clone();
                    initialAngle = angle;
                    initialRotationY = selected.rotation.y;
                } else {
                    const scale = dist / initialPinchDistance;
                    const camDir = new THREE.Vector3();
                    scene.camera.getWorldDirection(camDir);
                    selected.position.lerp(initialZ.clone().add(camDir.multiplyScalar((scale - 1) * 2)), 0.4);

                    const angleDelta = angle - initialAngle;
                    selected.rotation.y = initialRotationY + angleDelta * 2;
                }
                return;
            }

            updateMouse(evt);
            raycaster.setFromCamera(mouse, scene.camera);
            const camDir = new THREE.Vector3();
            scene.camera.getWorldDirection(camDir);
            plane.setFromNormalAndCoplanarPoint(camDir, scene.camera.position.clone().add(camDir.multiplyScalar(1.5)));

            const intersect = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersect);
            if (intersect) selected.position.lerp(intersect, 0.5);
        }

        function endDrag() {
            if (selected && selected.textEl) {
                selected.textEl.setAttribute("text", "color", "#333");
            }
            selected = null;
            isDragging = false;
            initialPinchDistance = null;
            initialAngle = null;
        }

        window.addEventListener("mousemove", moveSelected);
        window.addEventListener("touchmove", moveSelected);
        window.addEventListener("mouseup", endDrag);
        window.addEventListener("touchend", endDrag);
    }
});
