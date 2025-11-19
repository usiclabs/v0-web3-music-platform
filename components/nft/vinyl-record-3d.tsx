"use client"

import { useRef, useState, Suspense } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera, Html } from "@react-three/drei"
import * as THREE from "three"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from 'lucide-react'

interface VinylRecordProps {
  coverImage?: string
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary"
  isHovered?: boolean
  autoRotate?: boolean
  size?: number
}

function VinylRecordMesh({
  coverImage,
  rarity = "common",
  isHovered,
  autoRotate = true,
  size = 1,
}: VinylRecordProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [rotation, setRotation] = useState(0)

  // Load cover texture
  const coverTexture = coverImage
    ? useLoader(THREE.TextureLoader, coverImage)
    : null

  // Rarity colors (holographic effect)
  const rarityColors = {
    common: "#6b7280",
    uncommon: "#10b981",
    rare: "#3b82f6",
    epic: "#a855f7",
    legendary: "#f59e0b",
  }

  const rarityColor = rarityColors[rarity]

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Auto-rotate when not hovered
      if (autoRotate && !isHovered) {
        groupRef.current.rotation.y += delta * 0.5
        setRotation((r) => r + delta * 0.5)
      }
      
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1
      
      // Tilt effect when hovered
      if (isHovered) {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          Math.sin(state.clock.elapsedTime * 2) * 0.1,
          0.1
        )
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Vinyl disc */}
      <mesh>
        <cylinderGeometry args={[size, size, 0.02, 64]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.8}
          roughness={0.2}
          emissive={rarityColor}
          emissiveIntensity={isHovered ? 0.3 : 0.1}
        />
      </mesh>

      {/* Vinyl grooves (circular lines) */}
      {[...Array(20)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
          <ringGeometry args={[size * 0.3 + i * 0.03, size * 0.3 + i * 0.03 + 0.01, 64]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Center label with cover image */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, -rotation]}>
        <circleGeometry args={[size * 0.35, 64]} />
        {coverTexture ? (
          <meshStandardMaterial
            map={coverTexture}
            metalness={0.3}
            roughness={0.4}
          />
        ) : (
          <meshStandardMaterial
            color={rarityColor}
            metalness={0.5}
            roughness={0.5}
          />
        )}
      </mesh>

      {/* Center hole */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[size * 0.05, size * 0.05, 0.025, 32]} />
        <meshStandardMaterial color="#000000" metalness={1} roughness={0.1} />
      </mesh>

      {/* Holographic rim effect for rare items */}
      {rarity !== "common" && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[size * 0.98, size * 1.02, 64]} />
          <meshStandardMaterial
            color={rarityColor}
            emissive={rarityColor}
            emissiveIntensity={isHovered ? 1 : 0.5}
            metalness={1}
            roughness={0}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Sparkle particles for legendary */}
      {rarity === "legendary" && (
        <points>
          <sphereGeometry args={[size * 1.5, 32, 32]} />
          <pointsMaterial
            size={0.02}
            color={rarityColor}
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  )
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-white">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Loading...</span>
      </div>
    </Html>
  )
}

export function VinylRecord3D({
  coverImage,
  rarity = "common",
  autoRotate = true,
  size = 1,
  className = "",
}: VinylRecordProps & { className?: string }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas shadows className="cursor-pointer">
        <PerspectiveCamera makeDefault position={[0, 2, 4]} fov={50} />
        
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <VinylRecordMesh
            coverImage={coverImage}
            rarity={rarity}
            isHovered={isHovered}
            autoRotate={autoRotate}
            size={size}
          />
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Rarity badge overlay */}
      {rarity !== "common" && (
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant="secondary"
            className="flex items-center gap-1 backdrop-blur-sm bg-black/50 border-2"
            style={{ borderColor: rarityColors[rarity] }}
          >
            <Sparkles className="h-3 w-3" style={{ color: rarityColors[rarity] }} />
            <span className="capitalize" style={{ color: rarityColors[rarity] }}>
              {rarity}
            </span>
          </Badge>
        </div>
      )}
    </div>
  )
}

const rarityColors = {
  common: "#6b7280",
  uncommon: "#10b981",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
}
