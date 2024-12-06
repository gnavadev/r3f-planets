import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Sun from "./Sun"; // Assuming you have a Sun component
import Starfield from "./Starfield"; // Assuming you have a Starfield component
import Planet from "./Planet"; // Assuming your Planet component is in the same directory
import planetsData from "./planets.json"; // Import the planet data from the JSON file

const App = () => (
  <Canvas style={{ width: '100vw', height: '100vh' }} camera={{ position: [0, 0, 50], fov: 75 }}>
    <ambientLight intensity={.2}/>
    <OrbitControls />
    
    {/* Sun */}
    <Sun />
    
    {/* Dynamically render planets */}
    {planetsData.map((planet, index) => (
      <Planet
        key={index}
        orbitSpeed={planet.orbitSpeed}
        orbitRadius={planet.orbitRadius}
        orbitRotationDirection={planet.orbitRotationDirection}
        planetSize={planet.planetSize}
        planetRotationSpeed={planet.planetRotationSpeed}
        planetRotationDirection={planet.planetRotationDirection}
        planetTexture={planet.planetTexture}
        rimHex={planet.rimHex}
        rings={planet.rings} // Include rings if they exist
      />
    ))}
    
    {/* Starfield */}
    <Starfield numStars={3000} />
  </Canvas>
);

export default App;
