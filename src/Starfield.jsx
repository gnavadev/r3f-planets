import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending } from 'three';

const Starfield = ({ numStars = 1000 }) => {
  const groupRef = useRef();

  const generateRandomSpherePoint = () => {
    const radius = Math.random() * 200 + 200;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return {
      pos: [x, y, z],
      hue: 0.6,
      minDist: radius,
    };
  };

  const stars = [];
  for (let i = 0; i < numStars; i++) {
    const { pos, hue } = generateRandomSpherePoint();
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
