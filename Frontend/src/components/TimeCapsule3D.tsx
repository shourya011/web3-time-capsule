import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const Capsule = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
    }
  });

  // Create particles inside the capsule
  const particleCount = 100;
  const particles = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    particles[i] = radius * Math.sin(phi) * Math.cos(theta);
    particles[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particles[i + 2] = radius * Math.cos(phi);
  }

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group>
        {/* Black hole core - solid black */}
        <Sphere args={[1.8, 64, 64]}>
          <meshStandardMaterial 
            color="#000000"
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>

        {/* Event horizon glow */}
        <Sphere args={[2.0, 64, 64]}>
          <meshBasicMaterial 
            color="#1a0033" 
            transparent 
            opacity={0.8}
          />
        </Sphere>

        {/* Accretion disk - inner bright ring */}
        <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.15, 16, 100]} />
          <meshStandardMaterial 
            color="#64b5f6" 
            emissive="#64b5f6" 
            emissiveIntensity={2}
          />
        </mesh>

        {/* Accretion disk - middle ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.6, 0.12, 16, 100]} />
          <meshStandardMaterial 
            color="#8e24aa" 
            emissive="#8e24aa" 
            emissiveIntensity={1.5}
          />
        </mesh>

        {/* Accretion disk - outer ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.9, 0.08, 16, 100]} />
          <meshStandardMaterial 
            color="#00e5ff" 
            emissive="#00e5ff" 
            emissiveIntensity={1}
          />
        </mesh>

        {/* Swirling particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particles}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.08} color="#64b5f6" />
        </points>

        {/* Additional glow effect */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.3, 16, 100]} />
          <meshBasicMaterial 
            color="#64b5f6" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      </group>
    </Float>
  );
};

export const TimeCapsule3D = () => {
  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#64b5f6" />
        <pointLight position={[-10, -10, -10]} color="#8e24aa" intensity={1.5} />
        <pointLight position={[0, 10, 0]} color="#00e5ff" intensity={1} />
        <Capsule />
      </Canvas>
    </div>
  );
};
