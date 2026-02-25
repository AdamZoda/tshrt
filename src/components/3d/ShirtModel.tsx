import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// A single decal layer placed on the shirt
export interface DecalLayer {
  id: string;
  imageUrl: string;
  side: 'front' | 'back';
  x: number;      // horizontal offset
  y: number;      // vertical offset
  size: number;    // continuous scale value (e.g. 0.04 to 0.40)
}

interface ShirtModelProps {
  color: string;
  decals?: DecalLayer[];
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  autoRotate?: boolean;
}

// ── Individual decal renderer ──────────────────────────────────────────
function SingleDecal({ layer }: { layer: DecalLayer }) {
  // Support both property names for compatibility between Studio and Cart contexts
  const textureUrl = layer.imageUrl || (layer as any).imageBase64;
  const texture = useTexture(textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Preserve original aspect ratio with continuous size
  const decalScale = useMemo(() => {
    const img = texture.image as HTMLImageElement | null;
    if (!img) return [layer.size, layer.size, layer.size] as [number, number, number];

    const w = img.width || 1;
    const h = img.height || 1;
    const aspect = w / h;

    if (aspect >= 1) {
      return [layer.size, layer.size / aspect, layer.size] as [number, number, number];
    } else {
      return [layer.size * aspect, layer.size, layer.size] as [number, number, number];
    }
  }, [texture, layer.size]);

  const isFront = layer.side === 'front';
  const posZ = isFront ? 0.13 : -0.13;
  const rotY = isFront ? 0 : Math.PI;

  return (
    <Decal
      position={[isFront ? layer.x : -layer.x, layer.y, posZ]}
      rotation={[0, rotY, 0]}
      scale={decalScale}
      map={texture}
      depthTest={true}
    />
  );
}

// ── Shirt mesh with all decals ─────────────────────────────────────────
function ShirtMesh({
  nodes,
  materials,
  decals,
}: {
  nodes: any;
  materials: any;
  decals: DecalLayer[];
}) {
  return (
    <mesh
      castShadow
      receiveShadow
      name="tshirt"
      geometry={nodes.tshirt.geometry}
      material={materials.color}
      position={[0, 0.1, 0]}
      dispose={null}
    >
      {decals.map((layer, index) => (
        <SingleDecal key={layer.id || `decal-${index}`} layer={layer} />
      ))}
    </mesh>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export function ShirtModel({
  color,
  decals = [],
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  autoRotate = false,
}: ShirtModelProps) {
  const { nodes, materials } = useGLTF('/tshirt.glb') as any;
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (materials?.color) {
      materials.color.color.set(color);
      materials.color.needsUpdate = true;
    }
  }, [color, materials]);

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

  return (
    <group ref={groupRef} position={position} scale={finalScale} rotation={rotation}>
      <ShirtMesh nodes={nodes} materials={materials} decals={decals} />
    </group>
  );
}

// ── Studio lighting — neutral & true-color ─────────────────────────────
export function StudioLights() {
  return (
    <>
      {/* Strong ambient base so colors are never darkened */}
      <ambientLight intensity={0.6} color="#ffffff" />

      {/* Main key light — strong, pure white, from above-front */}
      <directionalLight
        position={[2, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Fill light — left side, slightly softer, still neutral */}
      <directionalLight
        position={[-5, 4, 4]}
        intensity={0.6}
        color="#ffffff"
      />

      {/* Back light — illuminates the back of the shirt when rotated */}
      <directionalLight
        position={[0, 4, -6]}
        intensity={0.5}
        color="#ffffff"
      />

      {/* Subtle bottom fill so underside isn't completely dark */}
      <directionalLight
        position={[0, -3, 2]}
        intensity={0.2}
        color="#ffffff"
      />
    </>
  );
}

useGLTF.preload('/tshirt.glb');
