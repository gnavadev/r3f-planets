import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader, Color, DoubleSide, AdditiveBlending } from "three";
import { IcosahedronGeometry } from "three";
import { ShaderMaterial } from "three";

const Planet = ({
  trajectoryVelocity = 1,
  trajectoryRadius = 1,
  trajectoryDirection = "clockwise",
  bodyScale = 1,
  rotationVelocity = 1,
  rotationDirection = "clockwise",
  surfaceMap = "/assets/mercury-map.jpg",
  rimColorValue = 0x0088ff,
  coreColorValue = 0x000000,
  ring = null,
  moon = null,
}) => {
  const bodyGroupReference = useRef();
  const trajectoryReference = useRef(); 
  const textureProcessor = new TextureLoader();
  const surfaceTexture = textureProcessor.load(surfaceMap);

  useFrame(() => {
    if (trajectoryReference.current) {
      trajectoryReference.current.rotation.y +=
        trajectoryDirection === "clockwise" ? -trajectoryVelocity : trajectoryVelocity;
    }
    if (bodyGroupReference.current) {
      bodyGroupReference.current.rotation.y +=
        rotationDirection === "clockwise" ? -rotationVelocity : rotationVelocity;
    }
  });

  const atmosphericShaderLayer = new ShaderMaterial({
    uniforms: {
        peripheralColor: { value: new Color(rimColorValue) },
        centralColor: { value: new Color(coreColorValue) },
        atmosphericOffset: { value: 0.05 },
        luminosityFactor: { value: 2.5 },
        spectralExponent: { value: 4.0 }, 
        transparencyLevel: { value: 1.0 },
    },
    vertexShader: `
        uniform float atmosphericOffset;
        uniform float luminosityFactor;
        uniform float spectralExponent;

        varying float viewAngleModulation;

        void main() {
            vec4 transformedPosition = modelViewMatrix * vec4(position, 1.0);
            vec4 globalPosition = modelMatrix * vec4(position, 1.0);

            vec3 globalNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
            vec3 observationVector = normalize(globalPosition.xyz - cameraPosition);

            viewAngleModulation = atmosphericOffset + luminosityFactor * pow(1.0 + dot(observationVector, globalNormal), spectralExponent);

            gl_Position = projectionMatrix * transformedPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 peripheralColor;
        uniform vec3 centralColor;
        uniform float transparencyLevel;

        varying float viewAngleModulation;

        void main() {
            float blendFactor = clamp(viewAngleModulation, 0.0, 1.0);
            vec3 glowSpectrum = mix(centralColor, peripheralColor, blendFactor);
            
            gl_FragColor = vec4(glowSpectrum, blendFactor * transparencyLevel);
        }
    `,
    transparent: true,
    blending: AdditiveBlending,
  });

  return (
    <group ref={trajectoryReference}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[trajectoryRadius - 0.01, trajectoryRadius + 0.2, 64]} />
        <meshBasicMaterial color={0xadd8e6} side={DoubleSide} transparent />
      </mesh>

      <group ref={bodyGroupReference} position={[trajectoryRadius, 0, 0]}>
        <mesh>
          <icosahedronGeometry args={[bodyScale, 12]} />
          <meshPhongMaterial map={surfaceTexture} colorSpace={AdditiveBlending} />
        </mesh>

        <mesh scale={[1.1, 1.1, 1.1]} geometry={new IcosahedronGeometry(bodyScale, 12)} material={atmosphericShaderLayer} />

        {ring && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[bodyScale + 0.1, bodyScale + 0.1 + ring.size, 128]}
            />
            <meshBasicMaterial
              map={textureProcessor.load(ring.texture)}
              side={DoubleSide}
              transparent
              depthWrite={false}
              opacity={0.8}
            />
          </mesh>
        )}

        {moon && (
          <group position={[bodyScale + moon.distance, 2, 0]}>
            <mesh>
              <sphereGeometry args={[moon.size, 32, 32]} />
              <meshPhongMaterial map={textureProcessor.load(moon.texture)} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

export default Planet;