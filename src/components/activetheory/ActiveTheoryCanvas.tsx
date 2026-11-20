import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const ZONE_Z_POSITIONS = [0, -22, -44, -66, -88, -110, -132];

interface ActiveTheoryCanvasProps {
  targetZ: number;
  activeZone: number;
  mousePos: { x: number; y: number };
  onSelectZone: (zoneIndex: number) => void;
  onOpenCaseStudy: (systemIndex: number) => void;
  qualityMode?: 'ultra' | 'eco';
}

const PORTAL_PALETTES = [
  { a: new THREE.Color('#00f0ff'), b: new THREE.Color('#7000ff'), c: new THREE.Color('#ff006a') },
  { a: new THREE.Color('#a855f7'), b: new THREE.Color('#00f0ff'), c: new THREE.Color('#3b82f6') },
  { a: new THREE.Color('#00ffaa'), b: new THREE.Color('#00d4ff'), c: new THREE.Color('#4f46e5') },
  { a: new THREE.Color('#ffaa00'), b: new THREE.Color('#ff0055'), c: new THREE.Color('#7c3aed') },
  { a: new THREE.Color('#ff007f'), b: new THREE.Color('#00f0ff'), c: new THREE.Color('#6366f1') },
  { a: new THREE.Color('#00f0ff'), b: new THREE.Color('#10b981'), c: new THREE.Color('#8b5cf6') },
  { a: new THREE.Color('#ffffff'), b: new THREE.Color('#00f0ff'), c: new THREE.Color('#ff006a') },
];

// --- Custom GLSL Iridescent Liquid Metal / Crystal Shader ---
const IRIDESCENT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vDisp;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(p.x * 2.8 + uTime * 1.6) * cos(p.y * 2.8 - uTime * 1.4) * sin(p.z * 2.8 + uTime * 1.1);
    wave += 0.4 * sin((p.x + p.y) * 5.0 - uTime * 2.4);

    vec3 mouseWorld = vec3(uMouse.x * 2.2, uMouse.y * 1.8, 0.5);
    float dMouse = length(p - mouseWorld);
    float ripple = sin(dMouse * 6.0 - uTime * 5.0) * exp(-dMouse * 0.9) * 0.25;

    float disp = wave * 0.16 + ripple;
    vDisp = disp;

    vec3 displaced = p + normal * disp;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewPos = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const IRIDESCENT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vDisp;
  varying vec2 vUv;

  vec3 cosinePalette(float t) {
    return vec3(0.5) + vec3(0.5) * cos(6.28318 * (vec3(1.0) * t + vec3(0.0, 0.18, 0.38)));
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPos);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.2);

    vec3 base = mix(uColorB, uColorA, smoothstep(-0.2, 0.25, vDisp));
    base = mix(base, uColorC, fresnel);

    vec3 irid = cosinePalette(vDisp * 2.2 + fresnel + uTime * 0.15);
    vec3 lightDir = normalize(vec3(3.0, 5.0, 4.0));
    float spec = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), 48.0);

    float scan = smoothstep(0.9, 0.98, abs(sin(vDisp * 35.0 - uTime * 2.0)));

    vec3 col = mix(vec3(0.02, 0.02, 0.05), base, 0.45 + fresnel * 0.55);
    col += irid * fresnel * 0.4;
    col += uColorA * spec * 1.1;
    col += uColorC * scan * 0.3;

    gl_FragColor = vec4(col, 0.96);
  }
`;

// --- Custom GLSL Portal Screen Shader for Flagship Systems ---
const PORTAL_SCREEN_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uMode;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    float pattern = 0.0;
    if (uMode < 1.5) {
      // Mode 1: Audio Duplicacy Waveform & Hash Rings
      float wave = sin(uv.x * 16.0 + uTime * 3.0) * cos(uv.y * 12.0 - uTime * 2.0);
      float rings = sin(r * 24.0 - uTime * 4.0);
      pattern = smoothstep(0.1, 0.9, abs(wave * 0.5 + rings * 0.5));
    } else if (uMode < 2.5) {
      // Mode 2: T2NAS Parallel Vortex Streams
      float spiral = sin(a * 6.0 + r * 14.0 - uTime * 4.5);
      float grid = max(abs(sin(uv.x * 18.0)), abs(sin(uv.y * 18.0)));
      pattern = smoothstep(0.2, 0.95, spiral * 0.6 + pow(grid, 8.0) * 0.5);
    } else {
      // Mode 3: Enterprise Rsync Cryptographic Lattice
      vec2 gv = fract(uv * 5.0) - 0.5;
      float cell = length(gv);
      float pulse = sin(cell * 18.0 - uTime * 3.5 + r * 6.0);
      pattern = smoothstep(0.15, 0.9, pulse);
    }

    // Vignette & border glow
    float edge = smoothstep(0.75, 1.0, max(abs(uv.x), abs(uv.y)));
    vec3 col = mix(vec3(0.02, 0.02, 0.06), mix(uColorB, uColorA, pattern), 0.75);
    col += uColorA * edge * 0.9;

    gl_FragColor = vec4(col, 0.92);
  }
`;

// --- 1. Camera Flight Rig + 3D Interactive Cursor Fluid Ribbon ---
function CameraAndCursorRig({
  targetZ,
  activeZone,
  mousePos,
}: {
  targetZ: number;
  activeZone: number;
  mousePos: { x: number; y: number };
}) {
  const trailPoints = useMemo(() => {
    return Array.from({ length: 28 }, () => new THREE.Vector3(0, 0, 0));
  }, []);

  const ghostPointsA = useMemo(() => {
    return Array.from({ length: 24 }, () => new THREE.Vector3(0, 0, 0));
  }, []);

  const ghostPointsB = useMemo(() => {
    return Array.from({ length: 24 }, () => new THREE.Vector3(0, 0, 0));
  }, []);

  const userLineRef = useRef<THREE.Line>(null);
  const ghostALineRef = useRef<THREE.Line>(null);
  const ghostBLineRef = useRef<THREE.Line>(null);
  const cursorLightRef = useRef<THREE.PointLight>(null);

  const userGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(trailPoints), [trailPoints]);
  const ghostAGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(ghostPointsA), [ghostPointsA]);
  const ghostBGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(ghostPointsB), [ghostPointsB]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Smooth camera Z-flight through the tunnel + mouse parallax
    const desiredZ = targetZ + 7.2;
    const desiredX = mousePos.x * 1.15;
    const desiredY = 0.35 + mousePos.y * 0.65;

    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, desiredZ, Math.min(1, delta * 4.2));
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, desiredX, Math.min(1, delta * 5.0));
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, desiredY, Math.min(1, delta * 5.0));

    // Camera subtle banking roll based on horizontal velocity
    const roll = (desiredX - state.camera.position.x) * -0.18;
    state.camera.rotation.z = THREE.MathUtils.lerp(state.camera.rotation.z, roll, 0.1);
    state.camera.lookAt(mousePos.x * 0.45, 0.15 + mousePos.y * 0.3, state.camera.position.z - 10);

    // Update User 3D Cursor Ribbon Trail
    const cursorWorld = new THREE.Vector3(
      mousePos.x * 3.8,
      0.2 + mousePos.y * 2.2,
      state.camera.position.z - 5.2
    );

    for (let i = trailPoints.length - 1; i > 0; i--) {
      trailPoints[i].lerp(trailPoints[i - 1], 0.45);
    }
    trailPoints[0].lerp(cursorWorld, 0.6);
    userGeo.setFromPoints(trailPoints);

    if (cursorLightRef.current) {
      cursorLightRef.current.position.copy(cursorWorld);
      const pal = PORTAL_PALETTES[activeZone % PORTAL_PALETTES.length];
      cursorLightRef.current.color.lerp(pal.a, 0.1);
    }

    // Update Autonomous Networked Visitor Ribbons (Active Theory multiplayer cursor feel)
    const ghostHeadA = new THREE.Vector3(
      Math.sin(t * 1.4) * 3.6,
      0.3 + Math.cos(t * 1.9) * 1.4,
      state.camera.position.z - 7.5 + Math.sin(t * 0.7) * 2.5
    );
    for (let i = ghostPointsA.length - 1; i > 0; i--) {
      ghostPointsA[i].lerp(ghostPointsA[i - 1], 0.38);
    }
    ghostPointsA[0].copy(ghostHeadA);
    ghostAGeo.setFromPoints(ghostPointsA);

    const ghostHeadB = new THREE.Vector3(
      Math.cos(t * 1.1) * -3.5,
      0.4 + Math.sin(t * 1.6) * 1.3,
      state.camera.position.z - 9.0 + Math.cos(t * 0.8) * 2.5
    );
    for (let i = ghostPointsB.length - 1; i > 0; i--) {
      ghostPointsB[i].lerp(ghostPointsB[i - 1], 0.38);
    }
    ghostPointsB[0].copy(ghostHeadB);
    ghostBGeo.setFromPoints(ghostPointsB);
  });

  return (
    <group>
      <pointLight ref={cursorLightRef} intensity={4} distance={9} color="#00f0ff" />
      <primitive
        ref={userLineRef}
        object={
          new THREE.Line(
            userGeo,
            new THREE.LineBasicMaterial({ color: '#00f0ff', transparent: true, opacity: 0.9 })
          )
        }
      />
      <primitive
        ref={ghostALineRef}
        object={
          new THREE.Line(
            ghostAGeo,
            new THREE.LineBasicMaterial({ color: '#ff006a', transparent: true, opacity: 0.55 })
          )
        }
      />
      <primitive
        ref={ghostBLineRef}
        object={
          new THREE.Line(
            ghostBGeo,
            new THREE.LineBasicMaterial({ color: '#a855f7', transparent: true, opacity: 0.55 })
          )
        }
      />
    </group>
  );
}

// --- 2. Architecture Corridor: Neon Light Arches & Longitudinal Splines ---
function TunnelArchitecture({ activeZone }: { activeZone: number }) {
  const archZPositions = useMemo(() => {
    const arr: number[] = [];
    for (let z = 4; z >= -146; z -= 5.5) {
      arr.push(z);
    }
    return arr;
  }, []);

  const pal = PORTAL_PALETTES[activeZone % PORTAL_PALETTES.length];

  return (
    <group>
      {/* Repeated Geometric Neon Portal Arches along the Corridor */}
      {archZPositions.map((z, idx) => {
        const isMajor = idx % 4 === 0;
        const color = idx % 2 === 0 ? pal.a : pal.c;
        return (
          <group key={z} position={[0, 1.2, z]}>
            {/* Left Pillar */}
            <mesh position={[-5.5, 0, 0]}>
              <boxGeometry args={[0.06, 6.4, 0.06]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isMajor ? 0.65 : 0.22}
              />
            </mesh>
            {/* Right Pillar */}
            <mesh position={[5.5, 0, 0]}>
              <boxGeometry args={[0.06, 6.4, 0.06]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isMajor ? 0.65 : 0.22}
              />
            </mesh>
            {/* Top Crossbeam */}
            <mesh position={[0, 3.2, 0]}>
              <boxGeometry args={[11.06, 0.05, 0.05]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isMajor ? 0.55 : 0.16}
              />
            </mesh>
            {/* Floor Guide Markers */}
            <mesh position={[-3.6, -3.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.15, 1.4]} />
              <meshBasicMaterial color={pal.a} transparent opacity={0.4} />
            </mesh>
            <mesh position={[3.6, -3.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.15, 1.4]} />
              <meshBasicMaterial color={pal.c} transparent opacity={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// --- 3. Zone 0 (Z = 0): The Active Theory Iridescent Hero Sculpture ---
function ZoneZeroSculpture({
  activeZone,
  mousePos,
}: {
  activeZone: number;
  mousePos: { x: number; y: number };
}) {
  const knotRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color('#00f0ff') },
      uColorB: { value: new THREE.Color('#7000ff') },
      uColorC: { value: new THREE.Color('#ff006a') },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uMouse.value.lerp(new THREE.Vector2(mousePos.x, mousePos.y), 0.1);

    const pal = PORTAL_PALETTES[activeZone % PORTAL_PALETTES.length];
    uniforms.uColorA.value.lerp(pal.a, 0.06);
    uniforms.uColorB.value.lerp(pal.b, 0.06);
    uniforms.uColorC.value.lerp(pal.c, 0.06);

    if (knotRef.current) {
      knotRef.current.rotation.y = t * 0.35 + mousePos.x * 0.4;
      knotRef.current.rotation.x = t * 0.22 + mousePos.y * 0.3;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.4;
      ring1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.35;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.3;
      ring2Ref.current.rotation.z = -t * 0.2;
    }
  });

  return (
    <group position={[0, 0.3, ZONE_Z_POSITIONS[0]]}>
      <mesh ref={knotRef}>
        <torusKnotGeometry args={[1.15, 0.36, 180, 32, 2, 3]} />
        <shaderMaterial
          vertexShader={IRIDESCENT_VERTEX}
          fragmentShader={IRIDESCENT_FRAGMENT}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {/* Orbiting Neon Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.25, 0.015, 12, 90]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.65} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.6, 0.012, 12, 90]} />
        <meshBasicMaterial color="#ff006a" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

// --- 4. Zones 1, 2, 3: 3D Flagship System Portal Monoliths ---
function FlagshipPortalMonoliths({
  onOpenCaseStudy,
}: {
  onOpenCaseStudy: (systemIndex: number) => void;
}) {
  const portals = useMemo(
    () => [
      {
        sysIndex: 0,
        z: ZONE_Z_POSITIONS[1],
        mode: 1.0,
        colorA: new THREE.Color('#a855f7'),
        colorB: new THREE.Color('#00f0ff'),
      },
      {
        sysIndex: 1,
        z: ZONE_Z_POSITIONS[2],
        mode: 2.0,
        colorA: new THREE.Color('#00ffaa'),
        colorB: new THREE.Color('#00d4ff'),
      },
      {
        sysIndex: 2,
        z: ZONE_Z_POSITIONS[3],
        mode: 3.0,
        colorA: new THREE.Color('#ffaa00'),
        colorB: new THREE.Color('#ff0055'),
      },
    ],
    []
  );

  const materials = useMemo(
    () =>
      portals.map(
        (p) =>
          new THREE.ShaderMaterial({
            vertexShader: /* glsl */ `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: PORTAL_SCREEN_FRAGMENT,
            uniforms: {
              uTime: { value: 0 },
              uColorA: { value: p.colorA },
              uColorB: { value: p.colorB },
              uMode: { value: p.mode },
            },
            transparent: true,
            side: THREE.DoubleSide,
          })
      ),
    [portals]
  );

  const coreRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    materials.forEach((m) => {
      m.uniforms.uTime.value = t;
    });
    coreRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        mesh.rotation.y = t * 0.7 + idx;
        mesh.rotation.x = t * 0.4;
      }
    });
  });

  return (
    <group>
      {portals.map((p, idx) => (
        <group key={p.z} position={[0, 0.35, p.z]}>
          {/* Clickable 3D Shader Portal Plane */}
          <mesh
            material={materials[idx]}
            onClick={(e) => {
              e.stopPropagation();
              onOpenCaseStudy(p.sysIndex);
            }}
          >
            <planeGeometry args={[4.4, 2.7, 1, 1]} />
          </mesh>

          {/* Outer Glowing Portal Frame */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[4.55, 2.85, 0.05]} />
            <meshBasicMaterial color={p.colorA} wireframe />
          </mesh>

          {/* Floating 3D Geometric Artifact Core in front of Portal */}
          <mesh
            ref={(el) => {
              coreRefs.current[idx] = el;
            }}
            position={[0, 0, 0.75]}
            onClick={(e) => {
              e.stopPropagation();
              onOpenCaseStudy(p.sysIndex);
            }}
          >
            <octahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={p.colorA}
              emissiveIntensity={1.6}
              wireframe
            />
          </mesh>

          <pointLight position={[0, 0.5, 1.5]} color={p.colorA} intensity={4} distance={10} />
        </group>
      ))}
    </group>
  );
}

// --- 5. Zone 4 (Z = -88): 3D AI Agent Swarm & Neural Lattice Core ---
function AIAgentNeuralLattice3D() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.35;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.45;
      ring1Ref.current.rotation.z = t * 0.25;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.4;
      ring2Ref.current.rotation.x = Math.sin(t * 0.5) * 0.4;
    }
  });

  return (
    <group position={[0, 0.5, ZONE_Z_POSITIONS[4]]}>
      <group ref={groupRef}>
        {/* Core Icosahedron Neural Lattice */}
        <mesh>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial
            color="#00f0ff"
            wireframe
            emissive="#00f0ff"
            emissiveIntensity={0.7}
            roughness={0.1}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Orbiting Gyroscope Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.5, 0.04, 16, 64]} />
        <meshBasicMaterial color="#a855f7" wireframe />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.0, 0.03, 16, 64]} />
        <meshBasicMaterial color="#00ffaa" wireframe />
      </mesh>

      <pointLight position={[0, 1, 2]} color="#00f0ff" intensity={4} distance={15} />
    </group>
  );
}

// --- 6. Zone 5 (-110) & Zone 6 (-132): Constellation Astrolabe & Transmission Stargate ---
function DeepZonesAstrolabeAndGate() {
  const astrolabeRef = useRef<THREE.Group>(null);
  const stargateRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (astrolabeRef.current) {
      astrolabeRef.current.rotation.y = t * 0.4;
      astrolabeRef.current.rotation.x = Math.sin(t * 0.5) * 0.25;
    }
    if (stargateRef.current) {
      stargateRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group>
      {/* Zone 5: Capabilities & Provenance 3D Astrolabe */}
      <group ref={astrolabeRef} position={[0, 0.4, ZONE_Z_POSITIONS[5]]}>
        <mesh>
          <icosahedronGeometry args={[1.45, 1]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.1, 0.02, 16, 80]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.4, 0.02, 16, 80]} />
          <meshBasicMaterial color="#00ffaa" />
        </mesh>
      </group>

      {/* Zone 6: Contact Transmission Stargate */}
      <group ref={stargateRef} position={[0, 0.4, ZONE_Z_POSITIONS[6]]}>
        <mesh>
          <torusGeometry args={[2.5, 0.06, 16, 100]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <mesh>
          <torusGeometry args={[2.1, 0.03, 16, 100]} />
          <meshBasicMaterial color="#ff006a" />
        </mesh>
        <mesh>
          <ringGeometry args={[0.2, 2.0, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0, 1]} color="#00f0ff" intensity={5} distance={15} />
      </group>
    </group>
  );
}

// --- 7. Streaming Tunnel Starfield Particles ---
function TunnelParticleStream() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 1600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color('#00f0ff');
    const c2 = new THREE.Color('#a855f7');
    const c3 = new THREE.Color('#ff006a');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 18;
      pos[i3 + 1] = -1.8 + Math.random() * 8;
      pos[i3 + 2] = 10 - Math.random() * 160;

      const pick = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      col[i3] = pick.r;
      col[i3 + 1] = pick.g;
      col[i3 + 2] = pick.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.position.z = Math.sin(state.clock.getElapsedTime() * 0.2) * 1.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export const ActiveTheoryCanvas: React.FC<ActiveTheoryCanvasProps> = ({
  targetZ,
  activeZone,
  mousePos,
  onOpenCaseStudy,
  qualityMode = 'ultra',
}) => {
  const isEco = qualityMode === 'eco';

  return (
    <div className="fixed inset-0 z-0 bg-[#020205]">
      <Canvas
        dpr={isEco ? [0.8, 1.0] : [1.0, 1.5]}
        camera={{ position: [0, 0.4, 7.2], fov: 50, near: 0.1, far: 120 }}
        gl={{ antialias: !isEco, powerPreference: isEco ? 'low-power' : 'high-performance' }}
      >
        <color attach="background" args={['#020205']} />
        <fog attach="fog" args={['#020205', 8, 42]} />

        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} color="#00f0ff" />

        {/* Camera Flight + Interactive 3D Cursor Ribbon Trails */}
        <CameraAndCursorRig
          targetZ={targetZ}
          activeZone={activeZone}
          mousePos={mousePos}
        />

        {/* Repeating Neon Corridor Arches */}
        <TunnelArchitecture activeZone={activeZone} />

        {/* Zone 0: Iridescent Torus-Knot Sculpture */}
        <ZoneZeroSculpture activeZone={activeZone} mousePos={mousePos} />

        {/* Zones 1, 2, 3: 3D Flagship System Portals */}
        <FlagshipPortalMonoliths onOpenCaseStudy={onOpenCaseStudy} />

        {/* Zone 4: 3D AI Agent Swarm & Neural Lattice Core */}
        <AIAgentNeuralLattice3D />

        {/* Zones 5 & 6: Astrolabe & Transmission Stargate */}
        <DeepZonesAstrolabeAndGate />

        {/* Ambient Corridor Particles */}
        <TunnelParticleStream />

        {/* Mirror-Reflective Wet Obsidian Floor (Active Theory Hydra Floor) */}
        <mesh position={[0, -2.0, -65]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[28, 175]} />
          <MeshReflectorMaterial
            blur={isEco ? [100, 30] : [300, 90]}
            resolution={isEco ? 256 : 512}
            mixBlur={1}
            mixStrength={45}
            roughness={0.35}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#06060c"
            metalness={0.85}
            mirror={0.75}
          />
        </mesh>
      </Canvas>
    </div>
  );
};

export default ActiveTheoryCanvas;
