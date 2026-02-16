"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

/* ─── Centerpiece: distorted glowing icosahedron ─── */
function Centerpiece() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    // Slow auto-rotation
    meshRef.current.rotation.y += delta * 0.15;
    meshRef.current.rotation.x += delta * 0.05;

    // Subtle mouse-follow tilt
    const targetRotX = pointer.y * 0.3;
    const targetRotZ = -pointer.x * 0.2;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      meshRef.current.rotation.x + targetRotX * 0.01,
      0.5,
    );
    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      targetRotZ,
      0.05,
    );
  });

  return (
    <Float speed={1} floatIntensity={0.4} rotationIntensity={0.2}>
      <group scale={2.5}>
        {/* Solid distorted form */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color="#1a0500"
            emissive="#FF4500"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
            distort={0.4}
            speed={2}
            toneMapped={false}
          />
        </mesh>

        {/* Wireframe overlay — violet structural grid */}
        <mesh scale={1.02}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial
            color="#7B2FFF"
            emissive="#7B2FFF"
            emissiveIntensity={0.5}
            wireframe
            transparent
            opacity={0.15}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* ─── Scene content (everything inside Canvas) ─── */
function SceneContent({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <pointLight
        position={[5, 5, 5]}
        intensity={0.6}
        color="#FF4500"
      />
      <pointLight
        position={[-4, -3, 3]}
        intensity={0.3}
        color="#7B2FFF"
      />

      {/* Centerpiece */}
      <Centerpiece />

      {/* Floating sparkle particles */}
      <Sparkles
        count={isMobile ? 30 : 80}
        scale={12}
        speed={0.4}
        opacity={0.5}
        color="#FF4500"
        size={isMobile ? 1.5 : 2}
      />

      {/* Post-processing */}
      {isMobile ? (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
      ) : (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
          <Vignette offset={0.3} darkness={0.9} />
        </EffectComposer>
      )}
    </>
  );
}

/* ─── Exported component ─── */
export function HeroScene({ className }: { className?: string }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <SceneContent isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
