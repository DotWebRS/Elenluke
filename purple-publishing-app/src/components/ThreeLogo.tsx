import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const ThreeLogo = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    /* ======================
       SCENE
    ====================== */
    const scene = new THREE.Scene();

    /* ======================
       CAMERA
    ====================== */
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    /* ======================
       RENDERER (realistic look)
    ====================== */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02; // bilo 1.08

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // SENKE OFF -> “no visible shadows in the logo”
    renderer.shadowMap.enabled = false;

    // modern three: physically correct lights
    (renderer as any).physicallyCorrectLights = true;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    wrapper.appendChild(renderer.domElement);

    /* ======================
       RESIZE
    ====================== */
    const resize = () => {
      const w = wrapper.clientWidth || 1;
      const h = wrapper.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    window.addEventListener("resize", resize);

    /* ======================
       ENVIRONMENT (shared lighting feel)
       -> daje isti “room” karakter refleksijama,
       -> logo deluje kao deo scene
    ====================== */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environment = envTex; // background ostaje transparentan jer ti je room slika u CSS-u

    /* ======================
       LIGHTING (soft studio, no harsh shadows)
       Cilj: logo čist (bez crnih senki), ali “u prostoru”
    ====================== */
    const hemi = new THREE.HemisphereLight(0xffffff, 0x070707, 0.32);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(0.3, 6.2, 4.2);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.22);
    fill.position.set(-4.0, 1.4, 3.8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.12);
    rim.position.set(-2.5, 2.2, -6.0);
    scene.add(rim);

    const spec = new THREE.PointLight(0xffffff, 0.18, 18);
    spec.position.set(0, 1.35, 3.6);
    scene.add(spec);

    scene.fog = new THREE.FogExp2(0x000000, 0.04);

    /* ======================
       LOGO GROUP
    ====================== */
    const logoGroup = new THREE.Group();
    // malo niže/udaljenije da izgleda kao u sobi
    logoGroup.position.set(0, 0.85, 0.25);
    scene.add(logoGroup);

    /* ======================
       SCALE-IN ANIMATION
       start small -> grow to current size
    ====================== */
    const START_SCALE = 0.14;
    const TARGET_SCALE = 0.88; // manji final

    let baseScale = START_SCALE;
    logoGroup.scale.setScalar(START_SCALE);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const scaleAnim = {
      active: true,
      start: performance.now(),
      dur: 850,
    };

    /* ======================
       MOUSE (subtle parallax)
    ====================== */
    let mouseX = 0;
    let mouseY = 0;
    let smoothX = 0;
    let smoothY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    /* ======================
       ROTATION SPEED (click “boost”)
    ====================== */
    const BASE_SPEED = 0.012;
    let currentSpeed = BASE_SPEED;
    let targetSpeed = BASE_SPEED;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(logoGroup.children, true);
      if (hits.length) {
        targetSpeed = 0.45;
        window.setTimeout(() => (targetSpeed = BASE_SPEED), 220);
      }
    };
    window.addEventListener("click", onClick);

    /* ======================
       SCROLL (optional positioning/scale)
    ====================== */
    let scrollScale = 1;
    const onScroll = () => {
      const p = THREE.MathUtils.clamp(window.scrollY / 650, 0, 1);
      // malo se “uvuče” ka headeru pri scrollu
      logoGroup.position.y = THREE.MathUtils.lerp(0.85, 1.25, p);

      scrollScale = THREE.MathUtils.lerp(1, 0.48, p);
    };
    window.addEventListener("scroll", onScroll);

    /* ======================
       LOAD MODEL
    ====================== */
    const loader = new GLTFLoader();
    let loadedRoot: THREE.Object3D | null = null;

    loader.load("/models/newlogo.glb", (gltf) => {
      const logo = gltf.scene;

      // centriranje
      const box = new THREE.Box3().setFromObject(logo);
      const center = box.getCenter(new THREE.Vector3());
      logo.position.sub(center);

      // tvoja “radna” veličina
      logo.scale.setScalar(9);

      // PBR tuning bez menjanja boje/tekstura
      logo.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          const tune = (m: any) => {
            if (!m) return;

            if ("metalness" in m) m.metalness = 0.55; // manje “sivljenja”
            if ("roughness" in m) m.roughness = 0.72;
            if ("envMapIntensity" in m) m.envMapIntensity = 0.22;

            // suptilan clearcoat (premium edge, bez plastike)
            if ("clearcoat" in m)  m.clearcoat = 0.08;
            if ("clearcoatRoughness" in m) m.clearcoatRoughness = 0.45;

            m.needsUpdate = true;
          };

          if (Array.isArray(mesh.material)) mesh.material.forEach(tune);
          else tune(mesh.material);

          // bez senki na samom logou
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      });

      loadedRoot = logo;
      logoGroup.add(logo);

      // scale-in startuje kad se model zaista pojavi
      scaleAnim.active = true;
      scaleAnim.start = performance.now();
    });

    /* ======================
       ANIMATE LOOP
    ====================== */
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);

      // smooth mouse
      smoothX += (mouseX - smoothX) * 0.10;
      smoothY += (mouseY - smoothY) * 0.10;

      // suptilna rotacija “u prostoru”
      logoGroup.rotation.x = smoothY * 0.22;
      logoGroup.rotation.z = -smoothX * 0.22;

      currentSpeed += (targetSpeed - currentSpeed) * 0.08;
      logoGroup.rotation.y += currentSpeed;

      // spec highlight prati miš vrlo suptilno
      spec.position.x = smoothX * 2.8;
      spec.position.y = 1.25 + smoothY * 1.8;

      // scale-in
      if (scaleAnim.active) {
        const t = (performance.now() - scaleAnim.start) / scaleAnim.dur;
        if (t >= 1) {
          baseScale = TARGET_SCALE;
          scaleAnim.active = false;
        } else {
          const eased = easeOutCubic(THREE.MathUtils.clamp(t, 0, 1));
          baseScale = THREE.MathUtils.lerp(START_SCALE, TARGET_SCALE, eased);
        }
      }

      logoGroup.scale.setScalar(baseScale * scrollScale);

      renderer.render(scene, camera);
    };

    onScroll();
    animate();

    /* ======================
       CLEANUP
    ====================== */
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);

      cancelAnimationFrame(raf);

      if (loadedRoot) {
        loadedRoot.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if ((mesh as any).isMesh) {
            mesh.geometry?.dispose?.();
            const mat = mesh.material as any;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
            else mat?.dispose?.();
          }
        });
      }

      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === wrapper) {
        wrapper.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
};
