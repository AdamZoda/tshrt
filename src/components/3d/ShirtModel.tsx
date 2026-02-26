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

// ── Single Decal Component (as child of mesh) ───────────────────────────────
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
  const [isReady, setIsReady] = useState(false);

  const textureUrl = imageUrl || layer.imageUrl || (layer as any).imageBase64;

  // Load texture asynchronously
  useEffect(() => {
    if (!textureUrl) {
      console.warn('⚠️ SingleDecal: No texture URL');
      setTexture(null);
      setIsReady(false);
      return;
    }

    let mounted = true;
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      textureUrl,
      (loadedTexture) => {
        if (mounted) {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          setTexture(loadedTexture);
          setIsReady(true);
          console.log('✅ Texture loaded:', textureUrl.substring(0, 50));
        }
      },
      undefined,
      (err) => {
        if (mounted) {
          console.error('⚠️ Texture load failed:', err);
          setTexture(null);
          setIsReady(false);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, [textureUrl]);

  if (!isReady || !texture) {
    return null;
  }

  // Calculate positions similar to old Tshirt.tsx
  const isFront = layer.side === 'front';
  let posZ = isFront ? 0.13 : -0.13;
  let rotY = isFront ? 0 : Math.PI;

  if (modelType === 'hoodie') {
    posZ = layer.posZ !== undefined ? layer.posZ : (isFront ? 0.15 : -0.15);
  }

  return (
    <Decal
      mesh={mesh}
      position={[isFront ? layer.x : -layer.x, layer.y, posZ]}
      rotation={[0, rotY, 0]}
      scale={[
        layer.size,
        layer.size,
        modelType === 'hoodie' ? 5.0 : layer.size // Increased thickness to avoid clipping in deep folds
      ]}
      renderOrder={10} // Higher than the cloth mesh
    >
      <meshStandardMaterial
        map={texture}
        transparent={true}
        depthTest={true}
        depthWrite={false}
        polygonOffset={true}
        polygonOffsetFactor={-15} // Aggressive offset to "lift" the image off the fabric
        polygonOffsetUnits={-15}
        toneMapped={false}
      />
    </Decal>
  );
}

// ── Single Decal S2 (SOLUTION 2 - with explicit mesh prop) ────────────────────────────────
// ⚠️ THIS DIDN'T WORK - Kept for reference only

// ── SingleDecalImp: Imperative decal creation for hoodie ────────────────────────────────────
function SingleDecalImp({
  layer,
  modelType,
  imageUrl,
}: {
  layer: DecalLayer;
  modelType: ModelType;
  imageUrl: string;
}) {
  const { scene } = useThree();
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!scene || !imageUrl) {
      console.warn(`⚠️ SingleDecalImp: Missing scene or imageUrl`);
      return;
    }

    // Choose the most likely visible mesh: largest bounding box volume
    let targetMesh: THREE.Mesh | null = null;
    let maxVolume = 0;
    scene.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        try {
          const geo = child.geometry as THREE.BufferGeometry;
          geo.computeBoundingBox();
          const bb = geo.boundingBox;
          if (bb) {
            const size = new THREE.Vector3();
            bb.getSize(size);
            const vol = size.x * size.y * size.z;
            if (vol > maxVolume) {
              maxVolume = vol;
              targetMesh = child;
            }
          }
        } catch (e) {
          // ignore
        }
      }
    });

    if (!targetMesh) {
      console.error('❌ SingleDecalImp: No target mesh found in scene');
      return;
    }

    console.log(`📥 SingleDecalImp: Using target mesh "${targetMesh.name || 'unknown'}" (vol=${maxVolume.toFixed(3)})`);

    // Load texture
    let mounted = true;
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      imageUrl,
      (loadedTexture) => {
        if (!mounted) return;
        try {
          if ('colorSpace' in loadedTexture) loadedTexture.colorSpace = THREE.SRGBColorSpace;
          console.log(`✅ SingleDecalImp: Texture loaded for layer ${layer.id}`);

          // compute world position from local coords (layer.x, layer.y)
          const isFront = layer.side === 'front';
          const localZ = isFront ? 0.15 : -0.15;
          const localPos = new THREE.Vector3(layer.x, layer.y, localZ);

          // convert local (mesh space) to world coords
          const worldPos = localPos.clone();
          targetMesh.updateWorldMatrix(true, false);
          targetMesh.localToWorld(worldPos);

          const rotY = isFront ? 0 : Math.PI;
          const rotation = new THREE.Euler(0, rotY, 0);
          const scale = new THREE.Vector3(layer.size, layer.size, layer.size);

          const decalGeometry = new DecalGeometry(targetMesh, worldPos, rotation, scale);
          const decalMaterial = new THREE.MeshPhongMaterial({
            map: loadedTexture,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            side: THREE.DoubleSide,
          });

          const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
          decalMesh.castShadow = false;
          decalMesh.receiveShadow = false;
          decalMesh.name = `decal-${layer.id}`;
          decalMesh.renderOrder = 10;

          // Add to scene (attach to targetMesh parent to keep same space)
          const parent = targetMesh.parent || scene;
          parent.add(decalMesh);
          meshRef.current = decalMesh;
          console.log(`✅ SingleDecalImp: Decal created for layer ${layer.id}`);
        } catch (err) {
          console.error(`❌ SingleDecalImp: Error creating decal:`, err);
        }
      },
      undefined,
      (err) => {
        console.error(`❌ SingleDecalImp: Texture load failed:`, err);
      }
    );

    return () => {
      mounted = false;
      if (meshRef.current && meshRef.current.parent) {
        meshRef.current.parent.remove(meshRef.current);
      }
    };
  }, [scene, imageUrl, layer]);

  return null;
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
  const meshGeometry = nodes?.tshirt?.geometry;
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
        {/* T-SHIRT DECALS */}
        {Array.isArray(decals) && decals.length > 0 &&
          decals
            .filter((layer) => !layer.modelType || layer.modelType === 'tshirt')
            .filter((layer) => {
              const url = layer.imageUrl || (layer as any).imageBase64;
              return url && url.length > 0;
            })
            .map((layer, index) => (
              <React.Suspense key={layer.id || `decal-${index}`} fallback={null}>
                <SingleDecal
                  layer={layer}
                  modelType="tshirt"
                  imageUrl={layer.imageUrl || (layer as any).imageBase64}
                  mesh={meshGeometry as any}
                />
              </React.Suspense>
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
  const gltfResult = useGLTF(glbPath) as any;
  const { scene } = gltfResult;
  const groupRef = useRef<THREE.Group>(null);

  // Find the body mesh to attach decals to
  const bodyMesh = React.useMemo(() => {
    if (!scene) return null;
    let bMesh: THREE.Mesh | null = null;
    let maxVol = 0;
    scene.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const bb = child.geometry.boundingBox;
        if (bb) {
          const s = new THREE.Vector3();
          bb.getSize(s);
          const vol = s.x * s.y * s.z;
          if (vol > maxVol) {
            maxVol = vol;
            bMesh = child;
          }
        }
      }
    });

    if (bMesh) {
      console.log(`✅ HOODIE body found: "${(bMesh as any).name}"`);
    } else {
      console.error('❌ HOODIE: No body mesh found in GLB');
    }

    return bMesh;
  }, [scene]);

  // Apply color to all materials
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        try {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat?.color) {
              mat.color.set(color);
              mat.needsUpdate = true;
            }
          });
        } catch (err) {
          console.warn('⚠️ Hoodie color error:', err);
        }
      }
    });
  }, [color, scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const modelPos = MODEL_POSITIONING.hoodie;

  const filteredDecals = Array.isArray(decals) ? decals
    .filter((layer) => !layer.modelType || layer.modelType === 'hoodie')
    .filter((layer) => {
      const url = layer.imageUrl || (layer as any).imageBase64;
      return url && url.length > 0;
    }) : [];

  return (
    <group ref={groupRef} position={modelPos.position} scale={modelPos.scale}>
      <primitive object={scene} />

      {/*
        We use createPortal to imperatively render the declarative <SingleDecal> components
        as direct children of the specific bodyMesh inside the loaded GLTF hierarchy!
        This is the magic that makes DecalGeometry work perfectly while preserving the model.
      */}
      {bodyMesh && filteredDecals.map((layer, index) => {
        // Compute dynamic Z offset from the body mesh bounding box
        const isFront = layer.side === 'front';
        const bb = bodyMesh.geometry.boundingBox;

        let dynamicPosZ = isFront ? 0.3 : -0.3;
        if (bb) {
          // Push slightly outside the bounding sphere for cleaner projection
          dynamicPosZ = isFront ? bb.max.z + 0.1 : bb.min.z - 0.1;
        }

        return createPortal(
          <React.Suspense key={layer.id || `decal-${index}`} fallback={null}>
            <SingleDecal
              layer={{
                ...layer,
                y: layer.y + 0.15, // Offset Y to align T-shirt coordinate center with Hoodie chest center
                posZ: dynamicPosZ
              } as any}
              modelType="hoodie"
              imageUrl={layer.imageUrl || (layer as any).imageBase64}
              mesh={bodyMesh}
            />
          </React.Suspense>,
          bodyMesh
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
