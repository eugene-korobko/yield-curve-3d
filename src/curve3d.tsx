import { useEffect, useRef } from 'react';

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

import { Programs, draw, prepareProgram } from './program';
import { Camera } from './camera';

import * as basicVertexShaderSrc from './shaders/basic-vertex.glsl';
import * as singleColorFragmentShaderSrc from './shaders/one-color-fragment-shader.glsl';
import * as gradientColorFragmentShaderSrc from './shaders/gradient-color-fragment-shader.glsl';

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

/*interface Programs {
	basicVertexShader: WebGLShader;
	singleColorFragmentShader: WebGLShader;
	gradientColorFragementShader: WebGLShader;
	linesProgram: WebGLProgram;
	surfaceProgram: WebGLProgram;
}

function preparePrograms(gl: WebGL2RenderingContext): Programs {
	const basicVertexShader = createShader(gl, gl.VERTEX_SHADER, basicVertexShaderSrc.default);
	const singleColorFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, singleColorFragmentShaderSrc.default);
	const gradientColorFragementShader = createShader(gl, gl.FRAGMENT_SHADER, gradientColorFragmentShaderSrc.default);
	const linesProgram = createProgram(gl, basicVertexShader, singleColorFragmentShader);
	const surfaceProgram = createProgram(gl, basicVertexShader, gradientColorFragementShader);
	return {
		basicVertexShader,
		singleColorFragmentShader,
		gradientColorFragementShader,
		linesProgram,
		surfaceProgram,
	}
}

function removePrograms(gl: WebGL2RenderingContext, programs: Programs): void {

}

interface UniformLocations {
	uModelMatrixLocation: WebGLUniformLocation;
	uViewMatrixLocation: WebGLUniformLocation;
	uProjectionMatrixLocation: WebGLUniformLocation;
	uColorLocation: WebGLUniformLocation;

	uMaxPriceLocation: WebGLUniformLocation;
	uMinPriceLocation: WebGLUniformLocation;
	uColorUpLocation: WebGLUniformLocation;
	uColorDownLocation: WebGLUniformLocation;
}*/

/*function draw(
	gl: WebGL2RenderingContext,
	programs: Programs,
	buffers: RenderingData,
	priceRange: PriceRange,
): void {
	gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	{
		gl.useProgram(programs.surfaceProgram);

		// draw
		const positionAttributeLocation = gl.getAttribLocation(programs.surfaceProgram, 'a_position');

		// draw surface
		gl.uniform4f(locations.uColorLocation, 1, 0, 0, 1);

		buffers.surfacesBuffers.forEach((buffer: DrawBuffer) => {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(positionAttributeLocation);

			{
				const size = 3;          // 3 components per iteration
				const type = gl.FLOAT;   // the data is 32bit floats
				const normalize = false; // don't normalize the data
				const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
				const offset = 0;        // start at the beginning of the buffer
				gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
			}

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.pointsCount);
		});
	}

	{
		gl.useProgram(programs.linesProgram);
		// draw lines
		gl.uniform4f(locations.uColorLocation, 0, 0, 1, 1);

		const positionAttributeLocation = gl.getAttribLocation(programs.surfaceProgram, 'a_position');

		buffers.linesBuffers.forEach((buffer: DrawBuffer) => {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(positionAttributeLocation);

			{
				const size = 3;          // 3 components per iteration
				const type = gl.FLOAT;   // the data is 32bit floats
				const normalize = false; // don't normalize the data
				const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
				const offset = 0;        // start at the beginning of the buffer
				gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
			}

			gl.drawArrays(gl.LINE_STRIP, 0, buffer.pointsCount);
		})	
	}
}*/


export function Curve3D() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(
		() => {
			const canvas = canvasRef.current!;
			const gl = canvas.getContext('webgl2')!;

			const programs = prepareProgram(gl);

			const data = testYieldData();
			//const lineBuffers = yieldDataToLineBuffers(data);
			const glBuffers = prepareBuffers(gl, data);

			const priceRange = datePriceRange(data);
			const priceRangeLength = priceRange[1] - priceRange[0];

			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

			const camera = new Camera(
				gl.canvas.width,
				gl.canvas.height,
				data.timescale.length,
				data.serieses.length,
				priceRange[0],
				priceRangeLength
			);

/*			const modelMatrix = mat4.create();
			mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(1, 1, 0.5 * data.timescale.length / data.serieses.length));

			const viewMatrix = mat4.create();

			mat4.scale(viewMatrix, viewMatrix, vec3.fromValues(
				0.5 * gl.canvas.width / data.timescale.length,
				-0.3 * gl.canvas.height / priceRangeLength,
				1)
			);
			mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(
				-data.timescale.length * 0.5,
				-priceRange[0] - priceRangeLength * 0.3,
				5)
			);

			mat4.rotateX(viewMatrix, viewMatrix, -Math.PI / 8);
			mat4.rotateY(viewMatrix, viewMatrix, Math.PI / 4);

			const projectionMatrix = mat4.create();

			mat4.ortho(
				projectionMatrix,
				-gl.canvas.width/2,
				gl.canvas.width/2,
				-gl.canvas.height/2,
				gl.canvas.height/2,
				-25000,
				25000
			);*/

/*			gl.useProgram(programs.linesProgram);

			const uModelMatrixLocation = gl.getUniformLocation(programs.linesProgram, 'u_modelMatrix')!;
			const uViewMatrixLocation = gl.getUniformLocation(programs.linesProgram, 'u_viewMatrix')!;
			const uProjectionMatrixLocation = gl.getUniformLocation(programs.linesProgram, 'u_projectionMatrix')!;

			const uColorLocation = gl.getUniformLocation(programs.linesProgram, 'u_color')!;

			gl.useProgram(programs.surfaceProgram);

			const uMinPriceLocation = gl.getUniformLocation(programs.surfaceProgram, 'u_minPrice')!;
			const uMaxPriceLocation = gl.getUniformLocation(programs.surfaceProgram, 'u_maxPrice')!;

			const uColorUpLocation = gl.getUniformLocation(programs.surfaceProgram, 'u_colorUp')!;
			const uColorDownLocation = gl.getUniformLocation(programs.surfaceProgram, 'u_colorDown')!;

			gl.useProgram(programs.linesProgram);

			gl.uniformMatrix4fv(uModelMatrixLocation, false, modelMatrix);
			gl.uniformMatrix4fv(uViewMatrixLocation, false, viewMatrix);
			gl.uniformMatrix4fv(uProjectionMatrixLocation, false, projectionMatrix);

			gl.uniform1f(uMinPriceLocation, priceRange[0]);
			gl.uniform1f(uMaxPriceLocation, priceRange[1]);*/

/*			draw(
				gl,
				programs,
				{
					uModelMatrixLocation,
					uViewMatrixLocation,
					uProjectionMatrixLocation,
					uColorLocation,
					uMinPriceLocation,
					uMaxPriceLocation,
					uColorUpLocation,
					uColorDownLocation,
				},
				glBuffers,
				priceRange,
			);*/
			draw(gl, programs, glBuffers, camera, priceRange);
			return () => {
				removeGLBuffers(gl, glBuffers);
			};
		},
		[]
	);

	return (<canvas className={ s.curve3d } ref={ canvasRef } width={ 800 } height={ 600 }>  
	</canvas>);
}
