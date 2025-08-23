import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Curve3D } from "./curve3d";

const rootElement = document.getElementById("root");

// New as of React v18.x
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <Curve3D />
  </StrictMode>
);


export function tst() {
    
}