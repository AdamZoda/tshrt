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

function SingleDecal({
  layer,
  modelType,
  imageUrl,
  mesh
}: {
  layer: DecalLayer;
  modelType: ModelType;
  imageUrl: string;
  mesh?: THREE.Mesh;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(false);

  // Manual texture loading instead of useTexture to avoid Suspense
  // which can cause "loss" of the parent mesh reference during transitions.
  useEffect(() => {
    if (!imageUrl) return;

    let mounted = true;
    setLoading(true);

    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (t) => {
        if (!mounted) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = false; // Standard for GLTF textures
        t.needsUpdate = true;
        setTexture(t);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("❌ SingleDecal: Failed to load texture", err);
        if (mounted) setLoading(false);
      }
    );

    return () => { mounted = false; };
  }, [imageUrl]);

  // CRITICAL GUARD: Never render <Decal> unless we have EVERYTHING.
  // This is the definitive fix for the "Decal must have a Mesh as parent" crash.
  if (!texture || !mesh || !(mesh instanceof THREE.Mesh)) {
    return null;
  }

  const isFront = layer.side === 'front';
  const rotY = isFront ? 0 : Math.PI;
  const projectionTargetZ = layer.posZ !== undefined ? layer.posZ : (isFront ? 0.2 : -0.2);
  const floatOffset = layer.depthOffset || 0;

  // We use the mesh prop explicitly to be 100% sure drei's internal check passes.
  // We wrap it in an object with 'current' to satisfy strict Ref types if needed.
  const meshRef = { current: mesh } as any;

  return (
    <group position={[0, 0, isFront ? floatOffset : -floatOffset]}>
      <Decal
        key={`${layer.id}-${imageUrl}`} // Key on imageUrl as well to force re-computation
        mesh={meshRef}
        position={[isFront ? layer.x : -layer.x, layer.y, projectionTargetZ]}
        rotation={[0, rotY, 0]}
        scale={[layer.size, layer.size, 10.0]} // Massive depth to encompass all folds/cords
        renderOrder={10}
      >
        <meshStandardMaterial
          map={texture}
          transparent={true}
          depthTest={true}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-20} // Stronger offset
          polygonOffsetUnits={-20}
          toneMapped={false}
        />
      </Decal>
    </group>
  );
}


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
              <SingleDecal
                key={layer.id || `decal-${index}`}
                layer={layer}
                modelType="tshirt"
                imageUrl={layer.imageUrl || (layer as any).imageBase64}
                mesh={tshirtMesh}
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
      {allTargetMeshes.length > 0 && filteredDecals.map((layer, index) => {
        const isFront = layer.side === 'front';

        // We render one instance of the decal for each mesh piece.
        // The Decal component will only show the part that intersects each mesh.
        return (
          <React.Fragment key={`${layer.id}-${index}`}>
            {allTargetMeshes.map((mesh, mIdx) => {
              // Calculate dynamic Z based on this specific mesh's bounding box
              const bb = mesh.geometry.boundingBox!;
              const meshZ = isFront ? bb.max.z + 0.01 : bb.min.z - 0.01;

              return createPortal(
                <SingleDecal
                  key={`${layer.id}-mesh-${mIdx}`}
                  layer={{
                    ...layer,
                    y: layer.y + 0.15,
                    posZ: meshZ,
                  }}
                  modelType="hoodie"
                  imageUrl={layer.imageUrl || (layer as any).imageBase64}
                  mesh={mesh}
                />,
                mesh
              );
            })}
          </React.Fragment>
        );
      })}
    </group>
  );
}

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
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[2, 8, 5]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-5, 4, 4]} intensity={0.6} color="#ffffff" />
      <directionalLight position={[0, 4, -6]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[0, -8, 0]} intensity={0.3} color="#ffffff" />
    </>
  );
}

// Preload GLBs
useGLTF.preload('/tshirt.glb');
useGLTF.preload('/hoodie4.glb');
