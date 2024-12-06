import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader, Color, DoubleSide, AdditiveBlending } from "three";
import { IcosahedronGeometry } from "three";
import { ShaderMaterial} from "three";

const Planet = ({
  orbitSpeed = 1,
  orbitRadius = 1,
  orbitRotationDirection = "clockwise",
  planetSize = 1,
  planetRotationSpeed = 1,
  planetRotationDirection = "clockwise",
  planetTexture = "/assets/mercury-map.jpg",
  rimHex = 0x0088ff,
  facingHex = 0x000000,
  rings = null,
}) => {
  const planetGroupRef = useRef(); // Ref for planet rotation
  const orbitRef = useRef(); // Ref for orbit rotation
  const loader = new TextureLoader();
  const map = loader.load(planetTexture);

  // Animate orbit and planet rotation
  useFrame(() => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y +=
        orbitRotationDirection === "clockwise" ? -orbitSpeed : orbitSpeed;
    }
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y +=
        planetRotationDirection === "clockwise" ? -planetRotationSpeed : planetRotationSpeed;
    }
  });

  // Shader Material for Planet Glow
  const planetGlowMaterial = new ShaderMaterial({
    uniforms: {
      color1: { value: new Color(rimHex) },
      color2: { value: new Color(facingHex) },
      fresnelBias: { value: 0.2 },
      fresnelScale: { value: 1.5 },
      fresnelPower: { value: 4.0 },
    },
    vertexShader: `
      uniform float fresnelBias;
      uniform float fresnelScale;
      uniform float fresnelPower;

      varying float vReflectionFactor;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

        vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

        vec3 I = worldPosition.xyz - cameraPosition;

        vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;

      varying float vReflectionFactor;

      void main() {
        float f = clamp( vReflectionFactor, 0.0, 1.0 );
        gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
  });

  return (
    <group ref={orbitRef}>
      {/* Orbit Line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.01, orbitRadius + 0.1, 64]} />
        <meshBasicMaterial color={0xadd8e6} side={DoubleSide} transparent />
      </mesh>

      {/* Planet Group */}
      <group ref={planetGroupRef} position={[orbitRadius, 0, 0]}>
        {/* Planet */}
        <mesh>
          <icosahedronGeometry args={[planetSize, 12]} />
          <meshPhongMaterial map={map} colorSpace={AdditiveBlending} />
        </mesh>

        {/* Planet Glow */}
        <mesh scale={[1.1, 1.1, 1.1]} geometry={new IcosahedronGeometry(planetSize, 12)} material={planetGlowMaterial} />

        {/* Rings */}
        {rings && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[planetSize + 0.1, planetSize + 0.1 + rings.ringsSize, 128]}
            />
            <meshBasicMaterial
              map={loader.load(rings.ringsTexture)}
              side={DoubleSide}
              transparent
              depthWrite={false} // Prevent depth conflicts
              opacity={0.8} // Add some transparency
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

export default Planet;
