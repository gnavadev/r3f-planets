import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, IcosahedronGeometry, MeshBasicMaterial, ShaderMaterial, Color, AdditiveBlending, Vector3, BackSide, Mesh, DynamicDrawUsage } from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

function Sun() {
  const groupRef = useRef();
  const coronaRef = useRef();
  const sunMap = useLoader(TextureLoader, '/assets/8k_sun.jpg');

  const coronaNoise = useMemo(() => new ImprovedNoise(), []);

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

  const rimMaterial = useMemo(() => createShaderMaterial(
    new Color(0xffff99),
    new Color(0x000000)
  ), []);

  const glowMaterial = useMemo(() => createShaderMaterial(
    new Color(0x000000),
    new Color(0xff0000)
  ), []);

  useEffect(() => {
    if (coronaRef.current) {
      coronaRef.current.userData.update = (t) => {
        const pos = coronaRef.current.geometry.attributes.position;
        const len = pos.count;
        const p = new Vector3();
        const v3 = new Vector3();

        for (let i = 0; i < len; i += 1) {
          p.fromBufferAttribute(pos, i).normalize();
          v3.copy(p).multiplyScalar(31);
          let ns = coronaNoise.noise(
            v3.x + Math.cos(t),
            v3.y + Math.sin(t),
            v3.z + t
          );
          v3.copy(p)
            .setLength(30.6)
            .addScaledVector(p, ns * 0.4);
          pos.setXYZ(i, v3.x, v3.y, v3.z);
        }
        pos.needsUpdate = true;
      };
    }
  }, [coronaNoise]);

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

function createShaderMaterial(color1, color2) {
  return new ShaderMaterial({
    uniforms: {
      color1: { value: color1 },
      color2: { value: color2 },
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
}

export default Sun;
