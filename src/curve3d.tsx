import { useEffect, useRef } from 'react';

import * as s from './curve3d.css';

export interface Curve3DProps {

}

export function Curve3D() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(
		() => {
			const canvas = canvasRef.current!;
			const gl = canvas.getContext('webgl2')!;

			// Basic WebGL setup (e.g., clearing color)
			gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
			gl.clear(gl.COLOR_BUFFER_BIT);

			// Add your WebGL rendering logic here (shaders, buffers, drawing)

		},
		[]
	);

	return (<canvas className={ s.curve3d } ref={ canvasRef }>  
	</canvas>);
}
