import { glMatrix, mat4, vec3, vec4 } from 'gl-matrix';

export class Camera {
	private _rotateY: mat4;
	private _rotateX: mat4;
	private _scale: mat4;
	private _translate: mat4;
	private _modelMatrix: mat4;
	private _viewMatrix!: mat4;
	private _projectionMatrix: mat4;

	public constructor(
		width: number,
		height: number,
		timePointsCount: number,
		seriesCount: number,
		minPrice: number,
		priceRangeLength: number
	) {
		this._modelMatrix = mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(1, 1, 1));

		this._rotateX = mat4.rotateX(mat4.create(), mat4.create(), Math.PI / 8);
		this._rotateY = mat4.rotateY(mat4.create(), mat4.create(), Math.PI / 4);

		this._scale = mat4.scale(
			mat4.create(),
			mat4.create(),
			vec3.fromValues(
				width / timePointsCount,
				0.3 * height / priceRangeLength,
				5 * timePointsCount / seriesCount
			)
		);

		this._translate = mat4.translate(
			mat4.create(),
			mat4.create(),
			vec3.fromValues(
				-timePointsCount * 0.5,
				-minPrice - priceRangeLength * 0.3,
				-0.5 * seriesCount
			)
		);

		this._updateViewMatrix();

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

	public rotateX(angle: number): void {
		this._rotateX = mat4.rotateX(this._rotateX, this._rotateX, angle);
		this._updateViewMatrix();
	}

	public rotateY(angle: number): void {
		this._rotateY = mat4.rotateY(this._rotateY, this._rotateY, angle);
		this._updateViewMatrix();
	}

	private _updateViewMatrix(): void {
		this._viewMatrix = mat4.create();
		this._viewMatrix = mat4.multiply(this._viewMatrix, this._viewMatrix, this._rotateX);
		this._viewMatrix = mat4.multiply(this._viewMatrix, this._viewMatrix, this._rotateY);
		this._viewMatrix = mat4.multiply(this._viewMatrix, this._viewMatrix, this._scale);
		this._viewMatrix = mat4.multiply(this._viewMatrix, this._viewMatrix, this._translate);
	}
}