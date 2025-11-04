import * as linesVertexShaderSrc from './shaders/lines-vertex-shader.glsl';
import * as linesFragmentShaderSrc from './shaders/lines-fragment-shader.glsl';

import * as surfaceVertexShaderSrc from './shaders/surface-vertex-shader.glsl';
import * as surfaceFragmentShaderSrc from './shaders/surface-fragment-shader.glsl';

import * as labelsVertexShaderSrc from './shaders/labels-vertex-shader.glsl';
import * as labelsFragmentShaderSrc from './shaders/labels-fragment-shader.glsl';

import { Camera } from './camera';
import { DrawBuffer, PriceRange, RenderingData, Segment } from './data';
import { mat4, vec3, vec4 } from 'gl-matrix';

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

export interface SurfaceProgramUniformLocations extends UniformLocationsBase {
	colorUp: WebGLUniformLocation;
	colorDown: WebGLUniformLocation;
	priceMin: WebGLUniformLocation;
	priceMax: WebGLUniformLocation;
}

export interface SurfaceProgram extends ProgramBase {
	uniformLocations: SurfaceProgramUniformLocations;
}

export interface LabelsProgramUniformLocations extends UniformLocationsBase {
	color: WebGLUniformLocation;
}

export interface LabelsProgram extends ProgramBase {
	uniformLocations: LabelsProgramUniformLocations;
	pointIndexAttributeLocation: number;
}

export interface Programs {
	linesProgram: LinesProgram;
	surfaceProgram: SurfaceProgram;
	labelsProgram: LabelsProgram;
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

function createLabelsProgram(gl: WebGL2RenderingContext): LabelsProgram {
	const labelsVertexShader = createShader(gl, gl.VERTEX_SHADER, labelsVertexShaderSrc.default);
	const labelsFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, labelsFragmentShaderSrc.default);
	const labelsProgram = createProgram(gl, labelsVertexShader, labelsFragmentShader);
	return {
		program: labelsProgram,
		vertexShader: labelsVertexShader,
		fragmentShader: labelsFragmentShader,
		uniformLocations: {
			...getBaseLocations(gl, labelsProgram),
			color: gl.getUniformLocation(labelsProgram, 'u_color')!,
		},
		positionAttributeLocation: gl.getAttribLocation(labelsProgram, 'a_position'),
		pointIndexAttributeLocation: gl.getAttribLocation(labelsProgram, 'a_pointIndex'),
	};
}

export function prepareProgram(gl: WebGL2RenderingContext): Programs {
	return {
		linesProgram: createLinesProgram(gl),
		surfaceProgram: createSurfaceProgram(gl),
		labelsProgram: createLabelsProgram(gl),
	};
}

export function applyCameraToUniforms(
	gl: WebGL2RenderingContext,
	uniforms: UniformLocationsBase,
	camera: Camera,
	addiitionalModelTransform: mat4 = mat4.create(),
 ): void {
	gl.uniformMatrix4fv(uniforms.modelMatrixLocation, false, mat4.multiply(mat4.create(), addiitionalModelTransform, camera.modelMatrix()));
	gl.uniformMatrix4fv(uniforms.viewMatrixLocation, false, camera.viewMatrix());
	gl.uniformMatrix4fv(uniforms.projectionMatrixLocation, false, camera.projectionMatrix());
}

export interface Vaos {
	surfacesVaos: WebGLVertexArrayObject[];
	linesVaos: WebGLVertexArrayObject[];
	axisVao: WebGLVertexArrayObject;
	labelsVao: WebGLVertexArrayObject;
}

export function prepareVaos(
	gl: WebGL2RenderingContext,
	programs: Programs,
	data: RenderingData,
): Vaos {
	function createAxisVao(): WebGLVertexArrayObject {
		gl.bindBuffer(gl.ARRAY_BUFFER, data.axisBuffer.glBuffer);
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.enableVertexAttribArray(programs.linesProgram.positionAttributeLocation);
		return vao;
	}
	function createLabelsVao(): WebGLVertexArrayObject {
		gl.bindBuffer(gl.ARRAY_BUFFER, data.labelsBuffer.glBuffer);
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.enableVertexAttribArray(programs.labelsProgram.positionAttributeLocation);
		gl.enableVertexAttribArray(programs.labelsProgram.pointIndexAttributeLocation);
		return vao;
	}
	return {
		surfacesVaos: data.surfacesBuffers.map((value: DrawBuffer) => {
			gl.bindBuffer(gl.ARRAY_BUFFER, value.glBuffer);
			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(programs.surfaceProgram.positionAttributeLocation);
			return vao;
		}),
		linesVaos: data.linesBuffers.map((value: DrawBuffer) => {
			gl.bindBuffer(gl.ARRAY_BUFFER, value.glBuffer);
			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(programs.surfaceProgram.positionAttributeLocation);
			return vao;
		}),
		axisVao: createAxisVao(),
		labelsVao: createLabelsVao(),
	};
}

function vertexAttribPointer(gl: WebGL2RenderingContext, positionAttributeLocation: number, stride: number = 0): number {
	const size = 3;          // 3 components per iteration
	const type = gl.FLOAT;   // the data is 32bit floats
	const normalize = false; // don't normalize the data
	const offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
	return 12;
}

function vertexAttribIPointer(gl: WebGL2RenderingContext, positionAttributeLocation: number, offset: number, stride: number = 0): void {
	const size = 1;          // 3 components per iteration
	const type = gl.FLOAT;   // the data is 32bit floats
	gl.vertexAttribPointer(positionAttributeLocation, size, type, false, stride, offset);
}

export function draw(
	gl: WebGL2RenderingContext,
	programs: Programs,
	data: RenderingData,
	vaos: Vaos,
	camera: Camera,
	priceRange: PriceRange,
): void {
	gl.clearColor(1.0, 1.0, 1.0, 1.0); // White background
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	// draw surface
	gl.useProgram(programs.surfaceProgram.program);
	gl.uniform4f(programs.surfaceProgram.uniformLocations.colorUp, 0.7, 0.7, 1, 1);
	gl.uniform4f(programs.surfaceProgram.uniformLocations.colorDown, 0.1, 0.1, 0.3, 1);
	gl.uniform1f(programs.surfaceProgram.uniformLocations.priceMin, priceRange[0]);
	gl.uniform1f(programs.surfaceProgram.uniformLocations.priceMax, priceRange[1]);

	applyCameraToUniforms(gl, programs.surfaceProgram.uniformLocations, camera);
	data.surfacesBuffers.forEach((buffer: DrawBuffer, index: number) => {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
		const vao = vaos.surfacesVaos[index];
		gl.bindVertexArray(vao);
		vertexAttribPointer(gl, programs.surfaceProgram.positionAttributeLocation);
		buffer.segments.forEach((segment: Segment) => {
			gl.drawArrays(gl.TRIANGLE_STRIP, segment.offset, segment.pointsCount);
		});
	});

	// draw lines
	
	gl.useProgram(programs.linesProgram.program);
	gl.uniform4f(programs.linesProgram.uniformLocations.colorLocation, 1, 1, 0.6, 1);
	applyCameraToUniforms(gl, programs.linesProgram.uniformLocations, camera);
	data.linesBuffers.forEach((buffer: DrawBuffer, index: number) => {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
		const vao = vaos.linesVaos[index];
		gl.bindVertexArray(vao);
		vertexAttribPointer(gl, programs.linesProgram.positionAttributeLocation);

		buffer.segments.forEach((segment: Segment) => {
			gl.drawArrays(gl.LINE_STRIP, segment.offset, segment.pointsCount);
		});
	});

	// draw axises
	// use the same progeam as for lines
	gl.uniform4f(programs.linesProgram.uniformLocations.colorLocation, 0.1, 0.1, 0.6, 1);
	applyCameraToUniforms(
		gl,
		programs.linesProgram.uniformLocations,
		camera,
		mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, priceRange[0], 0))
	);
	gl.bindBuffer(gl.ARRAY_BUFFER, data.axisBuffer.glBuffer);
	const vao = vaos.axisVao;
	gl.bindVertexArray(vao);
	vertexAttribPointer(gl, programs.linesProgram.positionAttributeLocation);

	data.axisBuffer.segments.forEach((segment: Segment) => {
		gl.drawArrays(gl.LINES, segment.offset, segment.pointsCount);
	});

	// draw labels
	{
		gl.useProgram(programs.labelsProgram.program);
		gl.uniform4f(programs.labelsProgram.uniformLocations.color, 0.1, 0.1, 0.6, 1);
		applyCameraToUniforms(
			gl,
			programs.labelsProgram.uniformLocations,
			camera,
			mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, priceRange[0], 0))
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, data.labelsBuffer.glBuffer);
		const vao = vaos.labelsVao;
		gl.bindVertexArray(vao);
		const offset = vertexAttribPointer(gl, programs.labelsProgram.positionAttributeLocation, 16);
		vertexAttribIPointer(gl, programs.labelsProgram.pointIndexAttributeLocation, offset, 16);

		data.labelsBuffer.segments.forEach((segment: Segment) => {
			gl.drawArrays(gl.TRIANGLE_STRIP, segment.offset, segment.pointsCount);
		});
	}
}

export function removePrograms(
	gl: WebGL2RenderingContext,
	programs: Programs,
): void {
	gl.deleteProgram(programs.linesProgram.program);
	gl.deleteProgram(programs.surfaceProgram.program);
}

export function removeVaos(
	gl: WebGL2RenderingContext,
	vaos: Vaos
): void {
	vaos.linesVaos.forEach(gl.deleteVertexArray.bind(gl));
	vaos.surfacesVaos.forEach(gl.deleteVertexArray.bind(gl));
}
