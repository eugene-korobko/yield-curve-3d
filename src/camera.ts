import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix';

export class Camera {
	private _modelMatrix: mat4;
	private _viewMatrix: mat4;
	private _projectionMatrix: mat4;

	public constructor(
		width: number,
		height: number,
		timePointsCount: number,
		seriesCount: number,
		minPrice: number,
		priceRangeLength: number
	) {
		this._modelMatrix = mat4.create();
		mat4.scale(this._modelMatrix, this._modelMatrix, vec3.fromValues(1, 1, 0.5 * timePointsCount / seriesCount));

		this._viewMatrix = mat4.create();

		mat4.scale(this._viewMatrix, this._viewMatrix, vec3.fromValues(
			0.5 * width / timePointsCount,
			-0.3 * height / priceRangeLength,
			1)
		);
		mat4.translate(this._viewMatrix, this._viewMatrix, vec3.fromValues(
			-timePointsCount * 0.5,
			-minPrice - priceRangeLength * 0.3,
			5)
		);

		mat4.rotateX(this._viewMatrix, this._viewMatrix, -Math.PI / 8);
		mat4.rotateY(this._viewMatrix, this._viewMatrix, Math.PI / 4);

		this._projectionMatrix = mat4.create();

		mat4.ortho(
			this._projectionMatrix,
			-width/2,
			width/2,
			-height/2,
			height/2,
			-25000,
			25000
		);
	}

	public modelMatrix(): mat4 {
		return this._modelMatrix;
	}

	public viewMatrix(): mat4 {
		return this._viewMatrix;
	}

	public projectionMatrix(): mat4 {
		return this._projectionMatrix;
	}
}