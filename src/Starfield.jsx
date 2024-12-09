import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending } from 'three';

const Starfield = ({ numStars = 1000 }) => {
  const groupRef = useRef();

  const generateUniformSphericalCoordinates = (
    minRadius = 200, 
    maxRadius = 600,
    baseHue = 0.6
  ) => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    return {
      pos: [x, y, z],
      hue: baseHue + (Math.random() - 0.5) * 0.1,
      minDist: radius
    };
  };

  const stars = [];
  for (let i = 0; i < numStars; i++) {
    const { pos, hue } = generateUniformSphericalCoordinates();
    const col = new Color().setHSL(hue, 0.2, Math.random());
    stars.push({ position: pos, color: col });
  }

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00005;
    }
  });

  return (
    <group ref={groupRef}>
      {stars.map((star, index) => (
        <mesh key={index} position={star.position}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial
            transparent
            alphaTest={0.5}
            blending={AdditiveBlending}
            color={star.color}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Starfield;
