import * as CLF2026 from './test-data/CLF2026.csv';
import * as CLG2026 from './test-data/CLG2026.csv';
import * as CLH2026 from './test-data/CLH2026.csv';
import * as CLJ2026 from './test-data/CLJ2026.csv';
import * as CLK2026 from './test-data/CLK2026.csv';
import * as CLM2026 from './test-data/CLM2026.csv';
import * as CLN2026 from './test-data/CLN2026.csv';

import * as CLQ2026 from './test-data/CLQ2026.csv';
import * as CLU2026 from './test-data/CLU2026.csv';
import * as CLV2026 from './test-data/CLV2026.csv';
import * as CLX2026 from './test-data/CLX2026.csv';
import * as CLZ2026 from './test-data/CLZ2026.csv';

export interface SeriesPoint {
	timeIndex: number;
	value: number;
}

export interface SeriesPlot {
	label: string;
	points: SeriesPoint[];
}

export interface TimePoint {
	label: string;
}

export interface YieldCurveData {
	timescale: TimePoint[];
	serieses: SeriesPlot[];
}

export type LinesBuffer = number[];	// 3 elements per point

function seriesPlotToLinesBuffer(seriesPlot: SeriesPlot, seriesIndex: number): LinesBuffer {
	const res: LinesBuffer = [];
	seriesPlot.points.forEach((point: SeriesPoint, index: number) => {
		res.push(point.timeIndex, point.value, seriesIndex);
	});
	return res;
}

function curveDataToLinesBuffers(data: YieldCurveData): LinesBuffer[] {
	const res: LinesBuffer[] = [];
	// each series generate line, index of series is Z coordinate
	data.serieses.forEach((seriesPlot: SeriesPlot, index: number) => {
		res.push(seriesPlotToLinesBuffer(seriesPlot, index));
	});
	return res;
}

export interface DrawBuffer {
	glBuffer: WebGLBuffer;
	pointsCount: number;
}

function createLineGLBuffers(gl: WebGL2RenderingContext, buffers: LinesBuffer[]): DrawBuffer[] {
	return buffers.map((buffer: LinesBuffer) => {
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
		return { glBuffer: positionBuffer, pointsCount: buffer.length / 3 };
	});
}

export interface RenderingData {
	linesBuffers: DrawBuffer[];
	surfacesBuffers: DrawBuffer[];
}

export function createSurfacesGLBuffers(gl: WebGL2RenderingContext, series1: LinesBuffer, series2: LinesBuffer): DrawBuffer {
	const mergedLinesBuffer = [];
	for (let i = 0; i < series1.length; i += 3) {
		mergedLinesBuffer.push(series1[i], series1[i+1], series1[i+2]);
		mergedLinesBuffer.push(series2[i], series2[i+1], series2[i+2]);
	}
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mergedLinesBuffer), gl.STATIC_DRAW);
	return { glBuffer: positionBuffer, pointsCount: mergedLinesBuffer.length / 3 };	
}

export function prepareBuffers(gl: WebGL2RenderingContext, data: YieldCurveData): RenderingData {
	const preparedLines = yieldDataToLineBuffers(data);
	const linesBuffers = createLineGLBuffers(gl, preparedLines);
	const surfacesBuffers: DrawBuffer[] = [];
	for (let i = 0; i < preparedLines.length - 1; i++) {
		surfacesBuffers.push(createSurfacesGLBuffers(gl, preparedLines[i], preparedLines[i+1]));
	}
	return {
		linesBuffers,
		surfacesBuffers,
	};

}


export function removeGLBuffers(gl: WebGL2RenderingContext, buffers: RenderingData): void {
	buffers.linesBuffers.concat(buffers.surfacesBuffers).forEach((buffer: DrawBuffer) => {
		gl.deleteBuffer(buffer.glBuffer);
	});
}

interface RawData {
	label: string;
	csv: string;
}

const linesLimit = 50;

function parseCSV(data: RawData): SeriesPlot {
	return {
		label: data.label,
		points: data
			.csv
			.split('\n')
			.slice(1)
			.slice(0, linesLimit)
			.map((s: string) => s.trim())
			.map((s: string) => s.split(','))
			.map((parts: string[]) => ({ timeIndex: parseInt(parts[0]), value: parseFloat(parts[1]) }))
	};
}

export function testYieldData(): YieldCurveData {
	const parsed = [
		{
			label: 'CLF2026',
			csv: CLF2026.default,
		},
		{
			label: 'CLG2026',
			csv: CLG2026.default,
		},
		{
			label: 'CLH2026',
			csv: CLH2026.default,
		},
		{
			label: 'CLJ2026',
			csv: CLJ2026.default,
		},
/*		{
			label: 'CLK2026',
			csv: CLK2026.default,
		},
		{
			label: 'CLM2026',
			csv: CLM2026.default,
		},
		{
			label: 'CLN2026',
			csv: CLN2026.default,
		},*/
		{
			label: 'CLQ2026',
			csv: CLQ2026.default,
		},
		{
			label: 'CLU2026',
			csv: CLU2026.default,
		},
/*		{
			label: 'CLV2026',
			csv: CLV2026.default,
		},
		{
			label: 'CLX2026',
			csv: CLX2026.default,
		},
		{
			label: 'CLZ2026',
			csv: CLZ2026.default,
		},*/
	].map(parseCSV);

	// collect all time points
	// lets use the first series
	const timescale = parsed[0].points.map((value: SeriesPoint) => ({
		label: new Date(value.timeIndex * 1000).toDateString()
	}));
	const serieses = parsed.map((plot: SeriesPlot) => ({
		label: plot.label,
		points: plot.points.map((point: SeriesPoint, index: number) => ({ timeIndex: index, value: point.value })),
	}));
	return {
		timescale,
		serieses,
	};
}

function seriesToLinesBuffer(series: SeriesPlot, seriesIndex: number): LinesBuffer {
	const res: LinesBuffer = [];
	series.points.forEach((p: SeriesPoint) => {
		res.push(p.timeIndex, p.value, seriesIndex + 1);
	});
	return res;
}

function timePointToLinesBuffer(data: YieldCurveData, timePoint: TimePoint, timePointIndex: number): LinesBuffer {
	const res: LinesBuffer = [];
	data.serieses.forEach((series: SeriesPlot, seriesIndex: number) => {
		res.push(timePointIndex, series.points[timePointIndex].value, seriesIndex + 1);
	});
	return res;
}

export function yieldDataToLineBuffers(data: YieldCurveData): LinesBuffer[] {
	return [
		...data.serieses.map(seriesToLinesBuffer),
		...data.timescale.map(timePointToLinesBuffer.bind(null, data)),
	]
}

export type PriceRange = [number, number];

function seriesPointToPriceRange(point: SeriesPoint): PriceRange {
	return [point.value, point.value];
}

function safeMinMax(calc: (n1: number, n2: number) => number, p1: number, p2: number): number {
	if (!Number.isFinite(p1)) {
		return p2;
	}
	if (!Number.isFinite(p2)) {
		return p1;
	}
	return calc(p1, p2);
}

const safeMin = safeMinMax.bind(null, Math.min);
const safeMax = safeMinMax.bind(null, Math.max);

function mergePriceRange(p1: PriceRange, p2: PriceRange): PriceRange {
	return [
		safeMin(p1[0], p2[0]),
		safeMax(p1[1], p2[1]),
	];
}

function seriesDataRange(series: SeriesPlot): PriceRange {
	return series.points.map(seriesPointToPriceRange).reduce(mergePriceRange, [NaN, NaN]);
}

export function datePriceRange(data: YieldCurveData): PriceRange {
	return data.serieses.map(seriesDataRange).reduce(mergePriceRange, [NaN, NaN]);
}


