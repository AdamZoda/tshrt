import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { useGLTF, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

console.log('🚀 ShirtModel.tsx LOADED - v2025-02-25');

// ── Types ─────────────────────────────────────────────────────────────
export interface DecalLayer {
  id: string;
  imageUrl: string;
  side: 'front' | 'back';
  x: number;
  y: number;
  size: number;
  modelType?: 'tshirt' | 'hoodie';  // NEW: Distinguish which clothing item
  posZ?: number; // Optional override for dynamic positioning
  depthOffset?: number; // Distance from surface
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

// Memoize to prevent re-renders when other decals move
const SingleDecal = React.memo(({
  layer,
  modelType,
  texture,
  mesh
}: {
  layer: DecalLayer;
  modelType: ModelType;
  texture: THREE.Texture;
  mesh?: THREE.Mesh;
}) => {
  // CRITICAL GUARD: Never render <Decal> unless we have EVERYTHING.
  if (!texture || !mesh || !(mesh instanceof THREE.Mesh)) {
    return null;
  }

  const isFront = layer.side === 'front';
  const rotY = isFront ? 0 : Math.PI;
  // We place the projection slightly in front of the surface
  const projectionTargetZ = layer.posZ !== undefined ? layer.posZ : (isFront ? 0.12 : -0.12);
  const floatOffset = layer.depthOffset || 0;

  // Calculate aspect ratio to prevent squashing/stretching
  let aspectRatio = 1;
  if (texture.image) {
    const width = texture.image.width || 1;
    const height = texture.image.height || 1;
    aspectRatio = width / height;
  }

  const meshRef = { current: mesh } as any;

  return (
    <group position={[0, 0, isFront ? floatOffset : -floatOffset]}>
      <Decal
        key={`${layer.id}-${texture.uuid}`}
        mesh={meshRef}
        position={[isFront ? layer.x : -layer.x, layer.y, projectionTargetZ]}
        rotation={[0, rotY, 0]}
        scale={[layer.size * aspectRatio, layer.size, 0.25]} // Shallow depth (0.25) to PREVENT bleeding but cover folds
        renderOrder={10}
      >
        <meshStandardMaterial
          map={texture}
          transparent={true}
          depthTest={true}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-20}
          polygonOffsetUnits={-20}
          toneMapped={false}
          side={THREE.FrontSide} // Only render on front-facing triangles
        />
      </Decal>
    </group>
  );
});

// Internal helper for parent components to load textures once
function useDecalTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) return;
    let mounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(url, (t) => {
      if (!mounted) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      setTexture(t);
    });
    return () => { mounted = false; };
  }, [url]);

  return texture;
}

const DecalRenderer = React.memo(({
  layer,
  modelType,
  mesh,
  index
}: {
  layer: DecalLayer,
  modelType: ModelType,
  mesh: THREE.Mesh,
  index: number
}) => {
  const imageUrl = layer.imageUrl || (layer as any).imageBase64;
  const texture = useDecalTexture(imageUrl || '');

  if (!texture) return null;

  return (
    <SingleDecal
      layer={layer}
      modelType={modelType}
      texture={texture}
      mesh={mesh}
    />
  );
});


// ── Model Paths ────────────────────────────────────────────────────────
const MODEL_PATHS: Record<ModelType, string> = {
  tshirt: '/tshirt.glb',
  hoodie: '/hoodie4.glb',
};

// ── Model positioning & scaling ────────────────────────────────────────
const MODEL_POSITIONING: Record<ModelType, { position: [number, number, number]; scale: number }> = {
  tshirt: {
    position: [0, 1, 0],  // ← MODIFY T-SHIRT position here
    scale: 5,              // ← MODIFY T-SHIRT scale here
  },
  hoodie: {
    position: [0, -1, 0],  // ← MODIFY HOODIE position here
    scale: 5,              // ← MODIFY HOODIE scale here
  },
};

console.log(`[ShirtModel] 📦 Preloading GLB files at module load time...`);
try {
  useGLTF.preload(MODEL_PATHS.tshirt);
  console.log(`[ShirtModel] ✅ Preloaded tshirt.glb`);
} catch (e) {
  console.error(`[ShirtModel] ❌ Failed to preload tshirt.glb:`, e);
}

try {
  useGLTF.preload(MODEL_PATHS.hoodie);
  console.log(`[ShirtModel] ✅ Preloaded hoodie4.glb`);
} catch (e) {
  console.error(`[ShirtModel] ❌ Failed to preload hoodie4.glb:`, e);
}

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  🔒 TSHIRT COMPONENT - WORKING PERFECTLY - DO NOT TOUCH EVER !!  🔒        ║
// ╚════════════════════════════════════════════════════════════════════════════╝
function TshirtMesh({
  color,
  decals
}: {
  color: string;
  decals: DecalLayer[];
}) {
  const glbPath = MODEL_PATHS.tshirt;
  const gltfResult = useGLTF(glbPath);
  const { nodes, materials } = gltfResult as any;
  const groupRef = useRef<THREE.Group>(null);

  // T-SHIRT MESH NAME (do not change unless GLB changes)
  const tshirtMesh = nodes?.tshirt;
  const meshGeometry = tshirtMesh?.geometry;
  const meshMaterial = materials?.color || materials?.Material || new THREE.MeshStandardMaterial({ color: 0xffffff });

  useEffect(() => {
    if (meshMaterial?.color) {
      try {
        meshMaterial.color.set(color);
        meshMaterial.needsUpdate = true;
      } catch (err) {
        console.warn('⚠️ Tshirt color apply error:', err);
      }
    }
  }, [color, meshMaterial]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  if (!meshGeometry) {
    console.error('❌ CRITICAL: Tshirt mesh geometry not found - GLB might be corrupted');
    return null;
  }

  const modelPos = MODEL_POSITIONING.tshirt;

  return (
    <group ref={groupRef} position={modelPos.position} scale={modelPos.scale}>
      <mesh
        geometry={meshGeometry}
        material={meshMaterial}
        position={[0, 0.1, 0]}
        castShadow
        receiveShadow
        dispose={null}
      >
        {/* T-SHIRT DECALS - ONLY RENDER IF MESH IS READY */}
        {tshirtMesh && Array.isArray(decals) && decals.length > 0 &&
          decals
            .filter((layer) => !layer.modelType || layer.modelType === 'tshirt')
            .filter((layer) => {
              const url = layer.imageUrl || (layer as any).imageBase64;
              return url && url.length > 0;
            })
            .map((layer, index) => (
              <DecalRenderer
                key={layer.id || `decal-${index}`}
                layer={layer}
                modelType="tshirt"
                mesh={tshirtMesh}
                index={index}
              />
            ))}
      </mesh>
    </group>
  );
}

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  🔧 HOODIE COMPONENT - Portal injection of decals into primitive       ║
// ╚════════════════════════════════════════════════════════════════════════════╝
function HoodieMesh({
  color,
  decals
}: {
  color: string;
  decals: DecalLayer[];
}) {
  const glbPath = MODEL_PATHS.hoodie;
  const { scene } = useGLTF(glbPath) as any;
  const groupRef = useRef<THREE.Group>(null);

  // Find the main body mesh in the scene (don't clone it!)
  // Find ALL front-surface meshes to avoid occlusion by folds/cords
  const allTargetMeshes = React.useMemo(() => {
    const list: THREE.Mesh[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        // Compute bounding box if missing
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        const bb = child.geometry.boundingBox;
        if (bb) {
          const s = new THREE.Vector3();
          bb.getSize(s);
          const vol = s.x * s.y * s.z;
          // Only keep meshes big enough to be part of the garment (ignore tiny details)
          if (vol > 0.0001) {
            list.push(child);
          }
        }
      }
    });
    return list;
  }, [scene]);

  // Apply color to all materials
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => {
          if (m.color) {
            m.color.set(color);
            m.needsUpdate = true;
          }
        });
      }
    });
  }, [color, scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const modelPos = MODEL_POSITIONING.hoodie;
  const filteredDecals = decals.filter(d => !d.modelType || d.modelType === 'hoodie');

  return (
    <group ref={groupRef} position={modelPos.position} scale={modelPos.scale}>
      <primitive object={scene} />

      {/* HOODIE DECALS - PROJECT ON ALL MESHES TO AVOID HOLES */}
      {allTargetMeshes.length > 0 && filteredDecals.map((layer, index) => (
        <MultiMeshDecal
          key={`${layer.id}-${index}`}
          layer={layer}
          meshes={allTargetMeshes}
        />
      ))}
    </group>
  );
}

const MultiMeshDecal = React.memo(({
  layer,
  meshes
}: {
  layer: DecalLayer;
  meshes: THREE.Mesh[];
}) => {
  const imageUrl = layer.imageUrl || (layer as any).imageBase64;
  const texture = useDecalTexture(imageUrl || '');
  if (!texture) return null;

  const isFront = layer.side === 'front';

  return (
    <>
      {meshes.map((mesh, mIdx) => {
        if (!mesh.geometry) return null;
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox();
        }
        const bb = mesh.geometry.boundingBox;

        // PERFORMANCE OPTIMIZATION (Anti-Lag): 
        // Only project on meshes that are on the correct side (Front/Back)
        // We use a more robust center-based check
        const centerZ = (bb.max.z + bb.min.z) / 2;
        const isMeshFront = centerZ > -0.05;
        if (isFront !== isMeshFront) return null;

        const meshZ = bb
          ? (isFront ? bb.max.z + 0.01 : bb.min.z - 0.01)
          : (isFront ? 0.5 : -0.5);

        // IMPORTANT: We render as sibling, NOT child via portal.
        // This keeps the coordinate system consistent across all pieces.
        return (
          <SingleDecal
            key={`${layer.id}-mesh-${mIdx}`} // Unique key for React child
            layer={{
              ...layer,
              y: layer.y + 0.15,
              posZ: meshZ,
            }}
            modelType="hoodie"
            texture={texture}
            mesh={mesh}
          />
        );
      })}
    </>
  );
});

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  MAIN EXPORT - Dispatcher to correct model                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝
export function ShirtModel({
  color,
  modelType = 'tshirt',
  decals = [],
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  autoRotate = false,
}: ShirtModelProps) {
  console.log(`✅ ShirtModel rendering: ${modelType}`);

  if (modelType === 'tshirt') {
    return <TshirtMesh color={color} decals={decals} />;
  } else {
    return <HoodieMesh color={color} decals={decals} />;
  }
}

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  STUDIO LIGHTS                                                              ║
// ╚════════════════════════════════════════════════════════════════════════════╝
export function StudioLights({ studioMode = false }: { studioMode?: boolean }) {
  const intensityMult = studioMode ? 2.2 : 1.0;
  const ambientIntensity = studioMode ? 1.0 : 0.6;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#ffffff" />
      <directionalLight position={[2, 8, 5]} intensity={1.2 * intensityMult} color="#ffffff" castShadow />
      <directionalLight position={[-5, 4, 4]} intensity={0.6 * intensityMult} color="#ffffff" />
      <directionalLight position={[0, 4, -6]} intensity={0.5 * intensityMult} color="#ffffff" />
      <directionalLight position={[0, -8, 0]} intensity={0.3 * intensityMult} color="#ffffff" />
    </>
  );
}

// Preload GLBs
useGLTF.preload('/tshirt.glb');
useGLTF.preload('/hoodie4.glb');
