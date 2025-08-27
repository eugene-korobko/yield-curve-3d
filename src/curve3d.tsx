import { useEffect, useRef } from 'react';

import { mat4 } from 'gl-matrix';

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

function draw(gl: WebGL2RenderingContext, program: WebGLProgram, vao: WebGLVertexArrayObject): void {
	gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
	gl.clear(gl.COLOR_BUFFER_BIT);

  	// Bind the attribute/buffer set we want.
  	gl.bindVertexArray(vao);

	// draw
	var primitiveType = gl.LINE_STRIP;
	var offset = 0;
	var count = 3;
	gl.drawArrays(primitiveType, offset, count);
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

			const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');

			const positionBuffer = gl.createBuffer();

			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(positionAttributeLocation);

			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

			const positions = [
  				100, 30, 1,
  				200, 50, 1,
  				300, 120, 1,
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

			{
				const size = 3;          // 3 components per iteration
				const type = gl.FLOAT;   // the data is 32bit floats
				const normalize = false; // don't normalize the data
				const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
				const offset = 0;        // start at the beginning of the buffer
				gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
			}

			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

			const modelMatrix = mat4.create();
			const viewMatrix = mat4.create();
    		const projectionMatrix = mat4.create();

			mat4.ortho(
				projectionMatrix,
				-gl.canvas.width/2,
				gl.canvas.width/2,
				-gl.canvas.height/2,
				gl.canvas.height/2,
				-50,
				50
			);

			const uModelMatrixLocation = gl.getUniformLocation(program, 'u_modelMatrix');
			const uViewMatrixLocation = gl.getUniformLocation(program, 'u_viewMatrix');
			const uProjectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix');

			gl.useProgram(program);

			gl.uniformMatrix4fv(uModelMatrixLocation, false, modelMatrix);
			gl.uniformMatrix4fv(uViewMatrixLocation, false, viewMatrix);
			gl.uniformMatrix4fv(uProjectionMatrixLocation, false, projectionMatrix);

			//gl.useProgram(program);

			//gl.bindVertexArray(vao);

/*			{
				const primitiveType = gl.LINE_STRIP;
				const offset = 0;
				const count = 3;
				gl.drawArrays(primitiveType, offset, count);
			}*/

			draw(gl, program, vao);
		},
		[]
	);

	return (<canvas className={ s.curve3d } ref={ canvasRef } width={ 800 } height={ 600 }>  
	</canvas>);
}
