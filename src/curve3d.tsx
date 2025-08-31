import { useEffect, useRef } from 'react';

import { glMatrix, mat4, vec3 } from 'gl-matrix';

import { createGLBuffers, datePriceRange, DrawBuffer, removeGLBuffers, testYieldData, yieldDataToLineBuffers } from './data';

import * as basicVertexShader from './shaders/basic-vertex.glsl';
import * as singleColorFragmentShader from './shaders/one-color-fragment-shader.glsl';

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

function draw(gl: WebGL2RenderingContext, program: WebGLProgram, buffers: DrawBuffer[]): void {
	gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
	gl.clear(gl.COLOR_BUFFER_BIT);

	// draw
	var primitiveType = gl.LINE_STRIP;
	var offset = 0;
//	var count = 50;

	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');


	buffers.forEach((buffer: DrawBuffer) => {
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

		gl.drawArrays(primitiveType, 0, buffer.pointsCount);
	})
	
}

export function Curve3D() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(
		() => {
			const canvas = canvasRef.current!;
			const gl = canvas.getContext('webgl2')!;

		    const vertexShader = createShader(gl, gl.VERTEX_SHADER, basicVertexShader.default);
		    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, singleColorFragmentShader.default);

			const program = createProgram(gl, vertexShader, fragmentShader);



			const data = testYieldData();
			const lineBuffers = yieldDataToLineBuffers(data);
			const glBuffers = createGLBuffers(gl, lineBuffers);

			const priceRange = datePriceRange(data);
			const priceRangeLength = priceRange[1] - priceRange[0];


			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

			const modelMatrix = mat4.create();
			mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(1, 1, 0.5 * data.timescale.length / data.serieses.length));

			const viewMatrix = mat4.create();

			mat4.scale(viewMatrix, viewMatrix, vec3.fromValues(
				0.8 * gl.canvas.width / data.timescale.length,
				-0.5 * gl.canvas.height / priceRangeLength,
				1)
			);
			mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(
				-data.timescale.length * 0.5,
				-priceRange[0] - priceRangeLength * 0.5,
				1)
			);

			mat4.rotateX(viewMatrix, viewMatrix, Math.PI / 8);
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
			);

			const uModelMatrixLocation = gl.getUniformLocation(program, 'u_modelMatrix');
			const uViewMatrixLocation = gl.getUniformLocation(program, 'u_viewMatrix');
			const uProjectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix');

			gl.useProgram(program);

			gl.uniformMatrix4fv(uModelMatrixLocation, false, modelMatrix);
			gl.uniformMatrix4fv(uViewMatrixLocation, false, viewMatrix);
			gl.uniformMatrix4fv(uProjectionMatrixLocation, false, projectionMatrix);

			draw(gl, program, glBuffers);
			return () => {
				removeGLBuffers(gl, glBuffers);
			};
		},
		[]
	);

	return (<canvas className={ s.curve3d } ref={ canvasRef } width={ 800 } height={ 600 }>  
	</canvas>);
}
