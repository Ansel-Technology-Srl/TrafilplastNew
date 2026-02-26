import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

// ─── Costanti geometriche ──────────────────────────────────────────────────
const PALO_WIDTH = 0.06;       // 6cm larghezza palo
const PALO_DEPTH = 0.06;       // 6cm profondità palo
const DOGA_HEIGHT = 0.04;      // 4cm altezza doga
const DOGA_DEPTH = 0.02;       // 2cm profondità doga
const DOGA_GAP_PERSIANA = 0.03; // 3cm gap tra doghe persiana
const DOGA_GAP_PIENO = 0.002;   // 0.2cm gap tra doghe pieno (quasi nulla)
const DOGA_TILT_PERSIANA = 0.25; // inclinazione doghe persiana (radianti)
const CAPPELLOTTO_HEIGHT = 0.03;
const SCALA = 0.01;            // 1cm = 0.01 unità 3D

// Tabella doghe (speculare al backend)
const TABELLA_DOGHE = {
  100: { persiana: 8, pieno: 9 },
  150: { persiana: 12, pieno: 14 },
  185: { persiana: 15, pieno: 17 },
  200: { persiana: 16, pieno: 18 },
};

// ─── Componente singolo Palo ───────────────────────────────────────────────
function Palo({ position, altezza, colore, isSelected, onClick }) {
  const meshRef = useRef();
  const h = altezza * SCALA;
  
  return (
    <group position={position}>
      {/* Corpo palo — con scanalature */}
      <mesh
        ref={meshRef}
        position={[0, h / 2, 0]}
        onClick={onClick}
        castShadow
      >
        <boxGeometry args={[PALO_WIDTH, h, PALO_DEPTH]} />
        <meshStandardMaterial
          color={colore}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Scanalature verticali (dettaglio estetico) */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * PALO_WIDTH * 0.35, h / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.005, h - 0.02, PALO_DEPTH + 0.002]} />
          <meshStandardMaterial
            color={colore}
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* Cappellotto */}
      <mesh position={[0, h + CAPPELLOTTO_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[PALO_WIDTH + 0.015, CAPPELLOTTO_HEIGHT, PALO_DEPTH + 0.015]} />
        <meshStandardMaterial
          color={colore}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Indicatore selezione */}
      {isSelected && (
        <mesh position={[0, h + 0.08, 0]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Base fissaggio */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <boxGeometry args={[PALO_WIDTH + 0.03, 0.01, PALO_DEPTH + 0.03]} />
        <meshStandardMaterial color="#555555" roughness={0.9} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Componente singola Doga ───────────────────────────────────────────────
function Doga({ position, lunghezza, colore, isPersiana, rotation = [0, 0, 0] }) {
  const l = lunghezza * SCALA;
  const tilt = isPersiana ? DOGA_TILT_PERSIANA : 0;

  return (
    <mesh
      position={position}
      rotation={[tilt, rotation[1], rotation[2]]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[l - PALO_WIDTH, DOGA_HEIGHT, DOGA_DEPTH]} />
      <meshStandardMaterial
        color={colore}
        roughness={0.65}
        metalness={0.05}
      />
    </mesh>
  );
}

// ─── Sezione completa (doghe tra due pali) ────────────────────────────────
function SezioneCompleta({
  startPos,
  endPos,
  altezza,
  tipoDoghe,
  coloreDoghe,
  numDoghe,
}) {
  const isPersiana = tipoDoghe === 'persiana';
  const gap = isPersiana ? DOGA_GAP_PERSIANA : DOGA_GAP_PIENO;
  const h = altezza * SCALA;

  // Centro della sezione
  const cx = (startPos[0] + endPos[0]) / 2;
  const cz = (startPos[2] + endPos[2]) / 2;

  // Lunghezza e rotazione della sezione
  const dx = endPos[0] - startPos[0];
  const dz = endPos[2] - startPos[2];
  const lunghezza = Math.sqrt(dx * dx + dz * dz) / SCALA; // in cm
  const rotY = Math.atan2(dz, dx);

  // Calcola posizioni verticali delle doghe
  const doghePosY = useMemo(() => {
    const positions = [];
    const totalDoghSpace = numDoghe * DOGA_HEIGHT + (numDoghe - 1) * gap;
    const startY = (h - totalDoghSpace) / 2 + DOGA_HEIGHT / 2 + 0.02; // 2cm offset dal basso

    for (let i = 0; i < numDoghe; i++) {
      positions.push(startY + i * (DOGA_HEIGHT + gap));
    }
    return positions;
  }, [numDoghe, h, gap]);

  return (
    <group>
      {doghePosY.map((y, i) => (
        <Doga
          key={i}
          position={[cx, y, cz]}
          lunghezza={lunghezza}
          colore={coloreDoghe}
          isPersiana={isPersiana}
          rotation={[0, rotY, 0]}
        />
      ))}
    </group>
  );
}

// ─── Griglia a terra ──────────────────────────────────────────────────────
function Terreno() {
  return (
    <group>
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#a0a0a0"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#707070"
        fadeDistance={15}
        fadeStrength={1.5}
        position={[0, 0, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e8e8e0" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ─── Freccia dimensione ───────────────────────────────────────────────────
function DimensionArrow({ start, end, label, yOffset = -0.05 }) {
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;

  return (
    <group>
      <Text
        position={[midX, yOffset, midZ - 0.1]}
        fontSize={0.06}
        color="#333333"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// ─── Scena principale ─────────────────────────────────────────────────────
function FenceSceneContent({
  sezioni,
  altezzaPali,
  tipoDoghe,
  coloreDoghe,
  colorePali,
  selectedPaloIndex,
  onPaloClick,
}) {
  // Calcola posizioni dei pali in base a sezioni e angoli
  const paliPositions = useMemo(() => {
    const positions = [[0, 0, 0]]; // primo palo all'origine
    let currentAngle = 0; // direzione corrente in radianti
    
    for (const sez of sezioni) {
      const lastPos = positions[positions.length - 1];
      const angleRad = (sez.angolo || 0) * (Math.PI / 180);
      currentAngle += angleRad;
      
      const dist = sez.lunghezza * SCALA;
      const newX = lastPos[0] + Math.cos(currentAngle) * dist;
      const newZ = lastPos[2] + Math.sin(currentAngle) * dist;
      positions.push([newX, 0, newZ]);
    }
    return positions;
  }, [sezioni]);

  const numDoghe = TABELLA_DOGHE[altezzaPali]
    ? (tipoDoghe === 'persiana'
        ? TABELLA_DOGHE[altezzaPali].persiana
        : TABELLA_DOGHE[altezzaPali].pieno)
    : 12;

  // Centro la camera sulla recinzione
  const center = useMemo(() => {
    if (paliPositions.length === 0) return [0, 0, 0];
    const xs = paliPositions.map(p => p[0]);
    const zs = paliPositions.map(p => p[2]);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (altezzaPali * SCALA) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
    ];
  }, [paliPositions, altezzaPali]);

  return (
    <>
      {/* Illuminazione */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />

      {/* Controlli camera */}
      <OrbitControls
        target={center}
        minDistance={0.5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.08}
      />

      {/* Terreno */}
      <Terreno />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={15}
        blur={2}
        far={5}
      />

      {/* Pali */}
      {paliPositions.map((pos, i) => (
        <Palo
          key={`palo-${i}`}
          position={pos}
          altezza={altezzaPali}
          colore={colorePali}
          isSelected={selectedPaloIndex === i}
          onClick={(e) => {
            e.stopPropagation();
            onPaloClick?.(i);
          }}
        />
      ))}

      {/* Sezioni (doghe tra pali) */}
      {sezioni.map((sez, i) => (
        <SezioneCompleta
          key={`sez-${i}`}
          startPos={paliPositions[i]}
          endPos={paliPositions[i + 1]}
          altezza={altezzaPali}
          tipoDoghe={tipoDoghe}
          coloreDoghe={coloreDoghe}
          numDoghe={numDoghe}
        />
      ))}

      {/* Dimensioni */}
      {sezioni.map((sez, i) => (
        <DimensionArrow
          key={`dim-${i}`}
          start={paliPositions[i]}
          end={paliPositions[i + 1]}
          label={`${sez.lunghezza} cm`}
        />
      ))}
    </>
  );
}

// ─── Wrapper Canvas esportato ─────────────────────────────────────────────
export default function FenceScene3D({
  sezioni = [],
  altezzaPali = 150,
  tipoDoghe = 'persiana',
  coloreDoghe = '#7B7B7B',
  colorePali = '#7B7B7B',
  selectedPaloIndex = null,
  onPaloClick,
  className = '',
}) {
  return (
    <div className={`w-full h-full min-h-[300px] ${className}`}>
      <Canvas
        shadows
        camera={{
          position: [3, 2.5, 3],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #e0eaf5 0%, #f5f5f0 60%)' }}
      >
        <FenceSceneContent
          sezioni={sezioni}
          altezzaPali={altezzaPali}
          tipoDoghe={tipoDoghe}
          coloreDoghe={coloreDoghe}
          colorePali={colorePali}
          selectedPaloIndex={selectedPaloIndex}
          onPaloClick={onPaloClick}
        />
      </Canvas>
    </div>
  );
}
