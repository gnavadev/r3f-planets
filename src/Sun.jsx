import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, IcosahedronGeometry, MeshBasicMaterial, ShaderMaterial, Color, AdditiveBlending, BackSide, DynamicDrawUsage } from 'three';

function Sun() {
  const groupRef = useRef();
  const coronaRef = useRef();
  const sunMap = useLoader(TextureLoader, '/assets/8k_sun.jpg');

  const sunGeometry = useMemo(() => new IcosahedronGeometry(30, 12), []);
  const sunMaterial = useMemo(() => new MeshBasicMaterial({
    map: sunMap,
  }), [sunMap]);

  const coronaGeometry = useMemo(() => {
    const geometry = new IcosahedronGeometry(6, 12);
    geometry.attributes.position.usage = DynamicDrawUsage;
    return geometry;
  }, []);

  const coronaMaterial = useMemo(() => new MeshBasicMaterial({
    color: 0xff0000,
    side: BackSide,
  }), []);

  const rimMaterial = useMemo(() => createSunShaderMaterial(
    new Color(0xffff99),
    new Color(0x000000)
  ), []);

  const glowMaterial = useMemo(() => createSunShaderMaterial(
    new Color(0x000000),
    new Color(0xff0000)
  ), []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime * 0.051;
      groupRef.current.rotation.y = -time * 5;
      if (coronaRef.current && coronaRef.current.userData.update) {
        coronaRef.current.userData.update(time);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={sunGeometry} material={sunMaterial} />
      <mesh ref={coronaRef} geometry={coronaGeometry} material={coronaMaterial} />
      <mesh geometry={sunGeometry} material={rimMaterial} scale={[1.01, 1.01, 1.01]} />
      <mesh geometry={sunGeometry} material={glowMaterial} scale={[1.1, 1.1, 1.1]} />
      <pointLight color={0xffff99} intensity={100000} position={[0, 0, 0]} />
    </group>
  );
}

function createSunShaderMaterial(coreColor, atmosphereColor) {
return new ShaderMaterial({
    uniforms: {
      primaryHue: { value: coreColor },
      secondaryHue: { value: atmosphereColor },
      luminanceIntensity: { value: 0.5 },
      radianceSpread: { value: 1.0 },
      luminancePower: { value: 5.0 },
    },
    vertexShader: `
      uniform float luminanceIntensity;
      uniform float radianceSpread;
      uniform float luminancePower;
      
      varying float celestialGlowParameter;
      
      void main() {
        vec4 transformedPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 globalPosition = modelMatrix * vec4(position, 1.0);
      
        vec3 globalNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
      
        vec3 observationVector = normalize(globalPosition.xyz - cameraPosition);
      
        celestialGlowParameter = luminanceIntensity + radianceSpread * pow(1.0 + dot(normalize(observationVector), globalNormal), luminancePower);
      
        gl_Position = projectionMatrix * transformedPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 primaryHue;
      uniform vec3 secondaryHue;
      
      varying float celestialGlowParameter;
      
      void main() {
        float glowModulation = clamp(celestialGlowParameter, 0.0, 1.0);
        gl_FragColor = vec4(mix(secondaryHue, primaryHue, vec3(glowModulation)), glowModulation);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
  });
}

export default Sun;
