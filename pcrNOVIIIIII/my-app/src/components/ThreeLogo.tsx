"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";


export const ThreeLogo = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    //RectAreaLightUniformsLib.init();

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.7, 5.7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    (renderer as any).physicallyCorrectLights = true;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    wrapper.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.1).texture;
    scene.environment = envTex;

    const softbox2= new THREE.DirectionalLight(0xffffff, 6.0);
    softbox2.position.set(10.6, 0.5, 3.3); // desno + napred
    softbox2.lookAt(0, 1.0, 0);
    //scene.add(softbox2);

    const negativeFill = new THREE.RectAreaLight(0x000000, 2.2, 5.0, 3.0);
    negativeFill.position.set(-1.8, 1.2, 2.8); // suprotna strana
    negativeFill.lookAt(0, 1.0, 0);
    //scene.add(negativeFill);

   
    RectAreaLightUniformsLib.init();

    const softboxL = new THREE.RectAreaLight(0xccc, 60, 5.2, 3.4);
    softboxL.position.set(-20.4, 2.8, 16.0);
    softboxL.lookAt(0, 1.0, 0);
    scene.add(softboxL);

    const softboxR = new THREE.RectAreaLight(0xccc, 60, 5.2, 3.4);
    softboxR.position.set(20.4, 2.8, 16.0);
    softboxR.lookAt(0, 1.0, 0);
    scene.add(softboxR);


  









    



    const logoGroup = new THREE.Group();
    logoGroup.position.set(0, 0.85, 0.25);
    scene.add(logoGroup);

    const START_SCALE = 0.14;
    const TARGET_SCALE = 0.88;
    let baseScale = START_SCALE;
    let scrollScale = 1;

    logoGroup.scale.setScalar(START_SCALE);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const scaleAnim = { active: true, start: performance.now(), dur: 850 };

    let mouseX = 0;
    let mouseY = 0;
    let smoothX = 0;
    let smoothY = 0;

    const BASE_SPEED = 0.012;
    let currentSpeed = BASE_SPEED;
    let targetSpeed = BASE_SPEED;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let loadedRoot: THREE.Object3D | null = null;

    const clamp = THREE.MathUtils.clamp;

    const applyWhiteMetal = (m: any) => {
      if (!m) return;
      if (!("metalness" in m) || !("roughness" in m)) return;
      m.color?.set?.(0xffffff);
      m.metalness = 0.85;
      m.roughness = 0.25;
      m.envMapIntensity = 0.85;
      if ("clearcoat" in m) m.clearcoat = 0.08;
      if ("clearcoatRoughness" in m) m.clearcoatRoughness = 0.32;

      if ("specularIntensity" in m) m.specularIntensity = 1.85;

      m.needsUpdate = true;
    };

    const applyBlackCoat = (m: any) => {
      if (!m) return;
      if (!("metalness" in m) || !("roughness" in m)) return;

      m.metalness = 0.95;
      m.roughness = 0.12;
      m.envMapIntensity = 0.85;
      if ("clearcoat" in m) m.clearcoat = 0.08;
      if ("clearcoatRoughness" in m) m.clearcoatRoughness = 0.32;


      if ("specularIntensity" in m) m.specularIntensity = 1.95;

      m.needsUpdate = true;
    };

    const tuneByName = (m: any) => {
      if (!m) return;
      const matName = String(m.name || "").trim().toLowerCase();

      if (matName === "white") {
        applyWhiteMetal(m);
        return;
      }

      if (matName === "material.002") {
        applyBlackCoat(m);
        return;
      }

      if ("envMapIntensity" in m) m.envMapIntensity = clamp(m.envMapIntensity ?? 0.25, 0.15, 0.55);
      if ("roughness" in m && typeof m.roughness === "number") m.roughness = clamp(m.roughness, 0.22, 0.85);
      if ("metalness" in m && typeof m.metalness === "number") m.metalness = clamp(m.metalness, 0.0, 0.8);

      if ("clearcoat" in m) m.clearcoat = clamp(m.clearcoat || 0, 0, 0.12);
      if ("clearcoatRoughness" in m) m.clearcoatRoughness = clamp(m.clearcoatRoughness || 0.5, 0.28, 0.9);

      m.needsUpdate = true;
    };

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onScroll = () => {
      const p = clamp(window.scrollY / 650, 0, 1);
      logoGroup.position.y = THREE.MathUtils.lerp(0.85, 1.25, p);
      scrollScale = THREE.MathUtils.lerp(1, 0.48, p);
    };

    const onClick = (e: MouseEvent) => {
      if (!loadedRoot) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(logoGroup.children, true);

      if (hits.length) {
        targetSpeed = 0.45;
        window.setTimeout(() => (targetSpeed = BASE_SPEED), 220);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick, { passive: true });

    const resize = () => {
      const w = wrapper.clientWidth || 1;
      const h = wrapper.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();
    onScroll();

    loader.load(
      "/models/step_geo.glb",
      (gltf) => {
        const logo = gltf.scene;

        const box = new THREE.Box3().setFromObject(logo);
        const center = box.getCenter(new THREE.Vector3());
        logo.position.sub(center);

        logo.scale.setScalar(9);

        logo.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if ((mesh as any).isMesh) {
            const mat: any = mesh.material;
            if (Array.isArray(mat)) mat.forEach(tuneByName);
            else tuneByName(mat);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });

        loadedRoot = logo;
        logoGroup.add(logo);

        scaleAnim.active = true;
        scaleAnim.start = performance.now();
      },
      undefined,
      () => {}
    );

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.033);
      const k = 1 - Math.pow(0.001, dt);

      smoothX += (mouseX - smoothX) * k;
      smoothY += (mouseY - smoothY) * k;

      logoGroup.rotation.x = smoothY * 0.22;
      logoGroup.rotation.z = -smoothX * 0.22;

      currentSpeed += (targetSpeed - currentSpeed) * k;
      logoGroup.rotation.y += currentSpeed;


      if (scaleAnim.active) {
        const t = (performance.now() - scaleAnim.start) / scaleAnim.dur;
        if (t >= 1) {
          baseScale = TARGET_SCALE;
          scaleAnim.active = false;
        } else {
          const eased = easeOutCubic(clamp(t, 0, 1));
          baseScale = THREE.MathUtils.lerp(START_SCALE, TARGET_SCALE, eased);
        }
      }

      logoGroup.scale.setScalar(baseScale * scrollScale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick);

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
      draco.dispose();
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
        position: "absolute",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
};
