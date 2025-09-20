import * as linesVertexShaderSrc from './shaders/lines-vertex-shader.glsl';
import * as linesFragmentShaderSrc from './shaders/lines-fragment-shader.glsl';

import * as surfaceVertexShaderSrc from './shaders/surface-vertex-shader.glsl';
import * as surfaceFragmentShaderSrc from './shaders/surface-fragment-shader.glsl';
import { Camera } from './camera';
import { DrawBuffer, PriceRange, RenderingData, Segment } from './data';
import { vec4 } from 'gl-matrix';

export interface UniformLocationsBase {
	modelMatrixLocation: WebGLUniformLocation;
	viewMatrixLocation: WebGLUniformLocation;
	projectionMatrixLocation: WebGLUniformLocation;
}

export interface ProgramBase {
	program: WebGLProgram;
	vertexShader: WebGLShader;
	fragmentShader: WebGLShader;
	uniformLocations: UniformLocationsBase;
	positionAttributeLocation: number;
}

export interface LinesProgramUniformLocations extends UniformLocationsBase {
	colorLocation: WebGLUniformLocation;
}

export interface LinesProgram extends ProgramBase {
	uniformLocations: LinesProgramUniformLocations;
}

export interface SurfaceProgramUniformLocation extends UniformLocationsBase {
	colorUp: WebGLUniformLocation;
	colorDown: WebGLUniformLocation;
	priceMin: WebGLUniformLocation;
	priceMax: WebGLUniformLocation;
}

export interface SurfaceProgram extends ProgramBase {
	uniformLocations: SurfaceProgramUniformLocation;
}

export interface Programs {
	linesProgram: LinesProgram;
	surfaceProgram: SurfaceProgram;
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

function createVao(gl: WebGL2RenderingContext, program: WebGLProgram): { vao: WebGLVertexArrayObject; positionAttributeLocation: number } {
	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	gl.enableVertexAttribArray(positionAttributeLocation);
	const size = 3;          // 3 components per iteration
	const type = gl.FLOAT;   // the data is 32bit floats
	const normalize = false; // don't normalize the data
	const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	const offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
	return { vao, positionAttributeLocation };
}

function getBaseLocations(gl: WebGL2RenderingContext, program: WebGLProgram): UniformLocationsBase {
	const modelMatrixLocation = gl.getUniformLocation(program, 'u_modelMatrix')!;
	const viewMatrixLocation = gl.getUniformLocation(program, 'u_viewMatrix')!;
	const projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')!;
	return {
		modelMatrixLocation,
		viewMatrixLocation,
		projectionMatrixLocation,
	};
}

function createLinesProgram(gl: WebGL2RenderingContext): LinesProgram {
	const linesVertexShader = createShader(gl, gl.VERTEX_SHADER, linesVertexShaderSrc.default);
	const linesFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, linesFragmentShaderSrc.default);
	const linesProgram = createProgram(gl, linesVertexShader, linesFragmentShader);
	return {
		program: linesProgram,
		vertexShader: linesVertexShader,
		fragmentShader: linesFragmentShader,
		uniformLocations: {
			...getBaseLocations(gl, linesProgram),
			colorLocation: gl.getUniformLocation(linesProgram, 'u_color')!,
		},
		positionAttributeLocation: gl.getAttribLocation(linesProgram, 'a_position'),
	}
}

function createSurfaceProgram(gl: WebGL2RenderingContext): SurfaceProgram {
	const surfaceVertexShader = createShader(gl, gl.VERTEX_SHADER, surfaceVertexShaderSrc.default);
	const surfaceFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, surfaceFragmentShaderSrc.default);
	const surfaceProgram = createProgram(gl, surfaceVertexShader, surfaceFragmentShader);
	return {
		program: surfaceProgram,
		vertexShader: surfaceVertexShader,
		fragmentShader: surfaceFragmentShader,
		uniformLocations: {
			...getBaseLocations(gl, surfaceProgram),
			colorUp: gl.getUniformLocation(surfaceProgram, 'u_colorUp')!,
			colorDown: gl.getUniformLocation(surfaceProgram, 'u_colorDown')!,
			priceMax: gl.getUniformLocation(surfaceProgram, 'u_priceMax')!,
			priceMin: gl.getUniformLocation(surfaceProgram, 'u_priceMin')!,
		},
		positionAttributeLocation: gl.getAttribLocation(surfaceProgram, 'a_position'),
	};
}

export function prepareProgram(gl: WebGL2RenderingContext): Programs {
	return {
		linesProgram: createLinesProgram(gl),
		surfaceProgram: createSurfaceProgram(gl),
	};
}

export function removeProgram(gl: WebGL2RenderingContext, programs: Programs): void {

}

export function applyCameraToUniforms(gl: WebGL2RenderingContext, uniforms: UniformLocationsBase, camera: Camera) {
	gl.uniformMatrix4fv(uniforms.modelMatrixLocation, false, camera.modelMatrix());
	gl.uniformMatrix4fv(uniforms.viewMatrixLocation, false, camera.viewMatrix());
	gl.uniformMatrix4fv(uniforms.projectionMatrixLocation, false, camera.projectionMatrix());
}

export function draw(
	gl: WebGL2RenderingContext,
	programs: Programs,
	data: RenderingData,
	camera: Camera,
	priceRange: PriceRange,
): void {
	gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	// draw surface
	gl.useProgram(programs.surfaceProgram.program);
	gl.uniform4f(programs.surfaceProgram.uniformLocations.colorUp, 0.2, 0.2, 1, 1);
	gl.uniform4f(programs.surfaceProgram.uniformLocations.colorDown, 0.2, 0.2, 0.5, 1);
	gl.uniform1f(programs.surfaceProgram.uniformLocations.priceMin, priceRange[0]);
	gl.uniform1f(programs.surfaceProgram.uniformLocations.priceMax, priceRange[1]);

	applyCameraToUniforms(gl, programs.surfaceProgram.uniformLocations, camera);
	data.surfacesBuffers.forEach((buffer: DrawBuffer) => {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.enableVertexAttribArray(programs.surfaceProgram.positionAttributeLocation);

		{
			const size = 3;          // 3 components per iteration
			const type = gl.FLOAT;   // the data is 32bit floats
			const normalize = false; // don't normalize the data
			const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
			const offset = 0;        // start at the beginning of the buffer
			gl.vertexAttribPointer(programs.surfaceProgram.positionAttributeLocation, size, type, normalize, stride, offset);
		}

		buffer.segments.forEach((segment: Segment) => {
			gl.drawArrays(gl.TRIANGLE_STRIP, segment.offset, segment.pointsCount);
		});
	});

	// draw lines
	
	gl.useProgram(programs.linesProgram.program);
	gl.uniform4f(programs.linesProgram.uniformLocations.colorLocation, 0, 0, 0, 1);
	applyCameraToUniforms(gl, programs.linesProgram.uniformLocations, camera);
	data.linesBuffers.forEach((buffer: DrawBuffer) => {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.enableVertexAttribArray(programs.linesProgram.positionAttributeLocation);

		{
			const size = 3;          // 3 components per iteration
			const type = gl.FLOAT;   // the data is 32bit floats
			const normalize = false; // don't normalize the data
			const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
			const offset = 0;        // start at the beginning of the buffer
			gl.vertexAttribPointer(programs.linesProgram.positionAttributeLocation, size, type, normalize, stride, offset);
		}

		buffer.segments.forEach((segment: Segment) => {
			gl.drawArrays(gl.LINE_STRIP, segment.offset, segment.pointsCount);
		});
	});

}