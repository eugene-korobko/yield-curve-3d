import { useEffect, useRef, WheelEvent } from 'react';

import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix';

import {
	prepareBuffers,
	datePriceRange,
	removeGLBuffers,
	testYieldData,
} from './data';

import { Programs, draw, prepareProgram, prepareVaos, removePrograms, removeVaos } from './program';
import { Camera } from './camera';

import * as s from './curve3d.css';

export interface Curve3DProps {

}

export function Curve3D() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const camera = useRef<Camera | null>(null);

	const paint = useRef<() => void>(() => {});

	useEffect(
		() => {
			const canvas = canvasRef.current!;
			const gl = canvas.getContext('webgl2')!;

			const programs = prepareProgram(gl);

			const data = testYieldData();
			const glBuffers = prepareBuffers(gl, data);
			const vaos = prepareVaos(gl, programs, glBuffers);

			const priceRange = datePriceRange(data);
			const priceRangeLength = priceRange[1] - priceRange[0];

			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

			camera.current = new Camera(
				gl.canvas.width,
				gl.canvas.height,
				data.timescale.length,
				data.serieses.length,
				priceRange[0],
				priceRangeLength
			);

			paint.current = draw.bind(
				null,
				gl,
				programs,
				glBuffers,
				vaos,
				camera.current,
				priceRange
			);
			paint.current();
			return () => {
				removePrograms(gl, programs);
				removeVaos(gl, vaos);
				removeGLBuffers(gl, glBuffers);
			};
		},
		[]
	);

	return (<canvas
		className={ s.curve3d }
		ref={ canvasRef }
		width={ 800 }
		height={ 600 }
		onWheel={ onWheel }
	/>);

	function onWheel(e: WheelEvent): void {
		console.log(e.deltaX, e.deltaY);
		camera.current?.rotateY(Math.PI * e.deltaX / 100);
		camera.current?.rotateX(Math.PI * e.deltaY / 100);
		paint.current();
	}
}
