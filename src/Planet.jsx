import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader, Color, DoubleSide, AdditiveBlending } from "three";
import { IcosahedronGeometry } from "three";
import { ShaderMaterial } from "three";

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
  moon = null,
}) => {
  const planetGroupRef = useRef();
  const orbitRef = useRef(); 
  const loader = new TextureLoader();
  const map = loader.load(planetTexture);

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

  const planetAtmosphereMaterial = new ShaderMaterial({
    uniforms: {
        atmosphereRimColor: { value: new Color(rimHex) },
        atmosphereCenterColor: { value: new Color(facingHex) },
        atmosphereBias: { value: 0.05 },
        atmosphereIntensity: { value: 2.5 },
        atmosphereExponent: { value: 4.0 }, 
        atmosphereOpacity: { value: 1.0 },
    },
    vertexShader: `
        uniform float atmosphereBias;
        uniform float atmosphereIntensity;
        uniform float atmosphereExponent;

        varying float viewAngleFactor;

        void main() {
            vec4 viewSpacePosition = modelViewMatrix * vec4(position, 1.0);
            vec4 worldSpacePosition = modelMatrix * vec4(position, 1.0);

            vec3 worldSpaceNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
            vec3 viewDirection = normalize(worldSpacePosition.xyz - cameraPosition);

            viewAngleFactor = atmosphereBias + atmosphereIntensity * pow(1.0 + dot(viewDirection, worldSpaceNormal), atmosphereExponent);

            gl_Position = projectionMatrix * viewSpacePosition;
        }
    `,
    fragmentShader: `
        uniform vec3 atmosphereRimColor;
        uniform vec3 atmosphereCenterColor;
        uniform float atmosphereOpacity;

        varying float viewAngleFactor;

        void main() {
            float blendFactor = clamp(viewAngleFactor, 0.0, 1.0);
            vec3 glowColor = mix(atmosphereCenterColor, atmosphereRimColor, blendFactor);
            
            gl_FragColor = vec4(glowColor, blendFactor * atmosphereOpacity);
        }
    `,
    transparent: true,
    blending: AdditiveBlending,
  });

  return (
    <group ref={orbitRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.01, orbitRadius + 0.2, 64]} />
        <meshBasicMaterial color={0xadd8e6} side={DoubleSide} transparent />
      </mesh>

      <group ref={planetGroupRef} position={[orbitRadius, 0, 0]}>
        <mesh>
          <icosahedronGeometry args={[planetSize, 12]} />
          <meshPhongMaterial map={map} colorSpace={AdditiveBlending} />
        </mesh>

        <mesh scale={[1.1, 1.1, 1.1]} geometry={new IcosahedronGeometry(planetSize, 12)} material={planetAtmosphereMaterial} />

        {rings && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[planetSize + 0.1, planetSize + 0.1 + rings.size, 128]}
            />
            <meshBasicMaterial
              map={loader.load(rings.texture)}
              side={DoubleSide}
              transparent
              depthWrite={false}
              opacity={0.8}
            />
          </mesh>
        )}

        {moon && (
          <group position={[planetSize + moon.distance, 2, 0]}>
            <mesh>
              <sphereGeometry args={[moon.size, 32, 32]} />
              <meshPhongMaterial map={loader.load(moon.texture)} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

export default Planet;