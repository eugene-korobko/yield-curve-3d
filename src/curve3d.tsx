import { useEffect, useRef, WheelEvent } from 'react';

import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix';

import {
	prepareBuffers,
	datePriceRange,
	DrawBuffer,
	removeGLBuffers,
	testYieldData,
	RenderingData,
	PriceRange,
} from './data';

import { Programs, draw, prepareProgram, prepareVaos, removeProgram, removeVaos } from './program';
import { Camera } from './camera';

import * as s from './curve3d.css';

export interface Curve3DProps {

}

function createShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error('Error creating shader');
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!success) {
		const error = new Error(`Error compiling shader ${gl.getShaderInfoLog(shader)}`);
		gl.deleteShader(shader);
		throw error;
	}
	return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	const success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	
	const error = new Error(`Error linking program ${gl.getProgramInfoLog(program)}`);
	gl.deleteProgram(program);
	throw error;
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
				removeProgram(gl, programs);
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
