"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
export const ThreeLogo = () => {
    const wrapperRef = useRef(null);
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper)
            return;
        const MODEL_URL = "/model.draco.glb";
        const DRACO_PATH = "/draco/";
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400);
        camera.position.set(0, 0, 30);
        camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.inset = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        wrapper.appendChild(renderer.domElement);
        // gradient layer BEHIND canvas
        wrapper.style.position = "fixed"; // već imaš, ali nek ostane
        wrapper.style.overflow = "hidden";
        const grad = document.createElement("div");
        grad.setAttribute("data-bg", "radial");
        grad.style.position = "absolute";
        grad.style.inset = "0";
        grad.style.zIndex = "0";
        grad.style.pointerEvents = "none";
        grad.style.background =
            "radial-gradient(circle at 50% 45%, rgba(138,79,255,0.26) 0%, rgba(0,0,0,0.10) 30%, rgba(0,0,0,0.78) 92%, rgba(0,0,0,1) 100%)";
        grad.style.transform = "scale(2)"; // “veći” krug
        grad.style.filter = "blur(0px)";
        wrapper.appendChild(grad);
        // canvas ABOVE gradient
        renderer.domElement.style.zIndex = "1";
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
        scene.environment = envTex;
        // Lights
        const key = new THREE.DirectionalLight(0xffffff, 2.35);
        key.position.set(10, 8, 12);
        //scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.85);
        fill.position.set(-11, 3, 10);
        //scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.95);
        rim.position.set(-8, 10, -12);
        //scene.add(rim);
        const top = new THREE.DirectionalLight(0xffffff, 0.55);
        top.position.set(0, 14, 7);
        //scene.add(top);
        const amb = new THREE.AmbientLight(0xffffff, 0.03);
        //scene.add(amb);
        const root = new THREE.Group();
        scene.add(root);
        const tiltGroup = new THREE.Group();
        tiltGroup.rotation.x = THREE.MathUtils.degToRad(90);
        root.add(tiltGroup);
        const rotator = new THREE.Group();
        tiltGroup.add(rotator);
        // Vinyl
        const vinylRadius = 12.0;
        const vinylThickness = 0.55;
        const vinylGeo = new THREE.CylinderGeometry(vinylRadius, vinylRadius, vinylThickness, 128, 1, false);
        const vinylMat = new THREE.MeshPhysicalMaterial({
            color: 0x050507,
            roughness: 0.12,
            metalness: 0.55,
            clearcoat: 0.95,
            clearcoatRoughness: 0.04,
            reflectivity: 0.95,
            envMapIntensity: 1.85,
        });
        const vinylMesh = new THREE.Mesh(vinylGeo, vinylMat);
        rotator.add(vinylMesh);
        const bevelGeo = new THREE.TorusGeometry(vinylRadius - 0.18, 0.14, 20, 140);
        const bevelMat = new THREE.MeshPhysicalMaterial({
            color: 0x08080c,
            roughness: 0.1,
            metalness: 0.62,
            clearcoat: 0.98,
            clearcoatRoughness: 0.035,
            reflectivity: 0.98,
            envMapIntensity: 2.05,
        });
        const bevel = new THREE.Mesh(bevelGeo, bevelMat);
        bevel.position.y = vinylThickness * 0.5 + 0.03;
        bevel.rotation.x = -Math.PI / 2;
        rotator.add(bevel);
        const labelRadius = 4.25;
        const labelGeo = new THREE.CircleGeometry(labelRadius, 160);
        const labelMat = new THREE.MeshStandardMaterial({
            color: 0x141423,
            roughness: 0.55,
            metalness: 0.08,
            envMapIntensity: 0.9,
        });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.y = vinylThickness * 0.5 + 0.02;
        labelMesh.rotation.x = -Math.PI / 2;
        rotator.add(labelMesh);
        const labelGlowGeo = new THREE.CircleGeometry(labelRadius * 0.98, 160);
        const labelGlowMat = new THREE.MeshBasicMaterial({
            color: 0x8a4fff,
            transparent: true,
            opacity: 0.055,
        });
        const labelGlow = new THREE.Mesh(labelGlowGeo, labelGlowMat);
        labelGlow.position.y = vinylThickness * 0.5 + 0.021;
        labelGlow.rotation.x = -Math.PI / 2;
        rotator.add(labelGlow);
        const holeGeo = new THREE.CylinderGeometry(0.22, 0.22, vinylThickness + 0.18, 64);
        const holeMat = new THREE.MeshStandardMaterial({
            color: 0x040405,
            roughness: 0.25,
            metalness: 0.1,
        });
        const holeMesh = new THREE.Mesh(holeGeo, holeMat);
        rotator.add(holeMesh);
        const groovesGroup = new THREE.Group();
        groovesGroup.position.y = vinylThickness * 0.5 + 0.032;
        groovesGroup.rotation.x = -Math.PI / 2;
        rotator.add(groovesGroup);
        const grooveBase = new THREE.MeshPhysicalMaterial({
            color: 0x0b0b12,
            roughness: 0.085,
            metalness: 0.52,
            clearcoat: 0.65,
            clearcoatRoughness: 0.06,
            envMapIntensity: 1.75,
            transparent: true,
            opacity: 0.32,
            side: THREE.DoubleSide,
        });
        const grooveStart = labelRadius + 0.55;
        const grooveEnd = vinylRadius - 0.55;
        const grooveCount = 10;
        for (let i = 0; i < grooveCount; i++) {
            const t0 = i / grooveCount;
            const t1 = (i + 1) / grooveCount;
            const rIn = THREE.MathUtils.lerp(grooveStart, grooveEnd, t0) + 0.06;
            const rOut = THREE.MathUtils.lerp(grooveStart, grooveEnd, t1);
            const ringGeo = new THREE.RingGeometry(rIn, rOut, 220);
            const m = grooveBase.clone();
            m.opacity = 0.14 + 0.22 * (1 - t0);
            const ring = new THREE.Mesh(ringGeo, m);
            groovesGroup.add(ring);
        }
        const highlightGeo = new THREE.RingGeometry(labelRadius + 0.7, vinylRadius - 0.9, 220);
        const highlightMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
        });
        const highlight = new THREE.Mesh(highlightGeo, highlightMat);
        highlight.position.y = vinylThickness * 0.5 + 0.038;
        highlight.rotation.x = -Math.PI / 2;
        highlight.rotation.z = THREE.MathUtils.degToRad(24);
        rotator.add(highlight);
        const highlight2Geo = new THREE.RingGeometry(labelRadius + 1.1, vinylRadius - 1.3, 220);
        const highlight2Mat = new THREE.MeshBasicMaterial({
            color: 0x8a4fff,
            transparent: true,
            opacity: 0.045,
            side: THREE.DoubleSide,
        });
        const highlight2 = new THREE.Mesh(highlight2Geo, highlight2Mat);
        highlight2.position.y = vinylThickness * 0.5 + 0.039;
        highlight2.rotation.x = -Math.PI / 2;
        highlight2.rotation.z = THREE.MathUtils.degToRad(-18);
        rotator.add(highlight2);
        // Responsive fit
        const applyFit = () => {
            const w = wrapper.clientWidth || 1;
            const h = wrapper.clientHeight || 1;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            const minDim = Math.min(w, h);
            const targetRadiusPx = minDim * 0.33;
            const s = THREE.MathUtils.clamp(targetRadiusPx / (vinylRadius * 10), 0.72, 0.92);
            rotator.scale.setScalar(s);
        };
        const ro = new ResizeObserver(applyFit);
        ro.observe(wrapper);
        applyFit();
        // Load model
        let logoRoot = null;
        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath(DRACO_PATH);
        draco.setDecoderConfig({ type: "wasm" });
        loader.setDRACOLoader(draco);
        loader.load(MODEL_URL, (gltf) => {
            const model = gltf.scene;
            // DEBUG: ako ovo ne ispiše, model se ne učitava
            console.log("[ThreeLogo] model loaded", model);
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            model.scale.setScalar(3.75);
            model.position.y = vinylThickness * 0.5 + 0.11;
            logoRoot = model;
            // ✅ ide u isti rotator kao vinil
            rotator.add(model);
        }, undefined, (err) => console.error("[ThreeLogo] GLB load error:", err));
        // Scroll rotation (smooth)
        let targetDeg = 0;
        let currentDeg = 0;
        let lastY = window.scrollY;
        const SPEED = 0.35;
        const onScroll = () => {
            const y = window.scrollY;
            const diff = lastY - y; // gore +, dole -
            lastY = y;
            targetDeg += diff * SPEED;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        // Animate
        let raf = 0;
        const clock = new THREE.Clock();
        const animate = () => {
            raf = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            labelGlowMat.opacity = 0.045 + (Math.sin(t * 1.0) * 0.5 + 0.5) * 0.02;
            highlightMat.opacity = 0.06 + (Math.sin(t * 0.75) * 0.5 + 0.5) * 0.02;
            highlight2Mat.opacity = 0.03 + (Math.cos(t * 0.85) * 0.5 + 0.5) * 0.015;
            currentDeg = THREE.MathUtils.lerp(currentDeg, targetDeg, 0.14);
            const rad = THREE.MathUtils.degToRad(currentDeg);
            rotator.rotation.y = rad;
            if (logoRoot)
                logoRoot.rotation.z = 0;
            renderer.render(scene, camera);
        };
        onScroll();
        animate();
        return () => {
            ro.disconnect();
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(raf);
            rotator.clear();
            tiltGroup.clear();
            root.clear();
            envTex.dispose();
            pmrem.dispose();
            draco.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === wrapper)
                wrapper.removeChild(renderer.domElement);
        };
    }, []);
    return (_jsx("div", { ref: wrapperRef, style: {
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            pointerEvents: "none",
            top: "var(--nav-h, 86px)",
            height: "calc(100vh - var(--nav-h, 86px))",
            zIndex: 0,
            opacity: 0.95,
        } }));
};
