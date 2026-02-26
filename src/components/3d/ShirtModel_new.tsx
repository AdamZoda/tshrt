import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ── Types ─────────────────────────────────────────────────────────────
export interface DecalLayer {
  id: string;
  imageUrl: string;
  side: 'front' | 'back';
  x: number;
  y: number;
  size: number;
}

export type ModelType = 'tshirt' | 'hoodie';

interface ShirtModelProps {
  color: string;
  modelType?: ModelType;
  decals?: DecalLayer[];
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  autoRotate?: boolean;
}

// ── Single Decal ───────────────────────────────────────────────────────
function SingleDecal({ layer }: { layer: DecalLayer }) {
  const textureUrl = layer.imageUrl || (layer as any).imageBase64;
  const texture = useTexture(textureUrl) as unknown as THREE.Texture;
  texture.colorSpace = THREE.SRGBColorSpace;

  const isFront = layer.side === 'front';
  const posZ = isFront ? 0.13 : -0.13;
  const rotY = isFront ? 0 : Math.PI;

  return (
    <Decal
      position={[isFront ? layer.x : -layer.x, layer.y, posZ]}
      rotation={[0, rotY, 0]}
      scale={[layer.size, layer.size, layer.size]}
      map={texture}
      depthTest={true}
    />
  );
}

// ── Model Paths ────────────────────────────────────────────────────────
const MODEL_PATHS: Record<ModelType, string> = {
  tshirt: '/tshirt.glb',
  hoodie: '/hoodie4.glb',
};

// ── Main Component ─────────────────────────────────────────────────────
export function ShirtModel({
  color,
  modelType = 'tshirt',
  decals = [],
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  autoRotate = false,
}: ShirtModelProps) {
  const glbPath = MODEL_PATHS[modelType];
  const { scene } = useGLTF(glbPath) as any;
  const groupRef = useRef<THREE.Group>(null);

  console.log(`🔄 [ShirtModel] modelType="${modelType}", path="${glbPath}"`);

  // Apply color to ALL materials in the scene
  useEffect(() => {
    if (!scene) return;

    console.log(`🎨 [ShirtModel] Applying color "${color}" to scene`);

    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        try {
          // Handle both single material and array of materials
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat && mat.color) {
              mat.color.set(color);
              mat.needsUpdate = true;
            }
          });
        } catch (err) {
          console.warn(`⚠️ Could not apply color to mesh`, err);
        }
      }
    });

    console.log(`✅ [ShirtModel] Color applied successfully`);
  }, [color, scene]);

  // Auto rotate
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const baseScale = 9;
  const finalScale: [number, number, number] = [
    baseScale * scale[0],
    baseScale * scale[1],
    baseScale * scale[2],
  ];

  // If no scene, return nothing (should not happen with valid GLB)
  if (!scene) {
    console.error(`❌ [ShirtModel] No scene found for "${modelType}"`);
    return null;
  }

  // Render the GLB scene directly
  return (
    <group key={modelType} ref={groupRef} position={position} scale={finalScale} rotation={rotation}>
      {/* Render the entire GLB scene */}
      <primitive object={scene} />

      {/* Decals on top (if needed for T-shirt) */}
      {decals.map((layer, index) => (
        <SingleDecal key={layer.id || `decal-${index}`} layer={layer} />
      ))}
    </group>
  );
}

// ── Studio Lighting ────────────────────────────────────────────────────
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[2, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 4, 4]} intensity={0.6} color="#ffffff" />
      <directionalLight position={[0, 4, -6]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[0, -3, 2]} intensity={0.2} color="#ffffff" />
    </>
  );
}

// ── Preload GLBs ───────────────────────────────────────────────────────
useGLTF.preload('/tshirt.glb');
useGLTF.preload('/hoodie4.glb');
