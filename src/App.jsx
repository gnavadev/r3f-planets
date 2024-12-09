import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Sun from "./Sun"; 
import Starfield from "./Starfield"; 
import Planet from "./Planet"; 
import planetsData from "./planets.json"; 

const App = () => (
  <Canvas style={{ width: '100vw', height: '100vh' }} camera={{ position: [50, 50, 100], fov: 75 }}>
    <ambientLight intensity={.8}/>
    <OrbitControls target={[0, 0, 0]} />
    
    <Sun />
    
    {planetsData.map((planet, index) => (
      <Planet
        key={index}
        trajectoryVelocity={planet.trajectoryVelocity}
        trajectoryRadius={planet.trajectoryRadius}
        trajectoryDirection={planet.trajectoryDirection}
        bodyScale={planet.bodyScale}
        rotationVelocity={planet.rotationVelocity}
        rotationDirection={planet.rotationDirection}
        surfaceMap={planet.surfaceMap}
        rimColorValue={planet.rimColorValue}
        ring={planet.ring}
        moon={planet.moon}
      />
    ))}
    
    <Starfield numStars={4000} />
  </Canvas>
);

export default App;
