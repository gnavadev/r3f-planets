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

  const planetGlowMaterial = new ShaderMaterial({
    uniforms: {
        rimColor: { value: new Color(rimHex) },
        centerColor: { value: new Color(facingHex) },
        fresnelBias: { value: 0.1 },
        fresnelIntensity: { value: 2.0 },
        fresnelExponent: { value: 3.5 },
        glowOpacity: { value: 1.0 },
    },
    vertexShader: `
        uniform float fresnelBias;
        uniform float fresnelIntensity;
        uniform float fresnelExponent;

        varying float viewAngleFactor;

        void main() {
            vec4 viewSpacePosition = modelViewMatrix * vec4(position, 1.0);
            vec4 worldSpacePosition = modelMatrix * vec4(position, 1.0);

            vec3 worldSpaceNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
            vec3 viewDirection = normalize(worldSpacePosition.xyz - cameraPosition);

            viewAngleFactor = fresnelBias + fresnelIntensity * pow(1.0 + dot(viewDirection, worldSpaceNormal), fresnelExponent);

            gl_Position = projectionMatrix * viewSpacePosition;
        }
    `,
    fragmentShader: `
        uniform vec3 rimColor;
        uniform vec3 centerColor;
        uniform float glowOpacity;

        varying float viewAngleFactor;

        void main() {
            float blendFactor = clamp(viewAngleFactor, 0.0, 1.0);
            vec3 glowColor = mix(centerColor, rimColor, blendFactor);
            
            gl_FragColor = vec4(glowColor, blendFactor * glowOpacity);
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

        <mesh scale={[1.1, 1.1, 1.1]} geometry={new IcosahedronGeometry(planetSize, 12)} material={planetGlowMaterial} />

        {rings && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[planetSize + 0.1, planetSize + 0.1 + rings.ringsSize, 128]}
            />
            <meshBasicMaterial
              map={loader.load(rings.ringsTexture)}
              side={DoubleSide}
              transparent
              depthWrite={false}
              opacity={0.8}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

export default Planet;
