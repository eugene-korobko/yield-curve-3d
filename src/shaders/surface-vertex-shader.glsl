#version 300 es

in vec4 a_position; // Vertex position in local object space

uniform mat4 u_modelMatrix;      // Model matrix: transforms from local to world space
uniform mat4 u_viewMatrix;       // View matrix: transforms from world to camera space
uniform mat4 u_projectionMatrix; // Projection matrix: transforms from camera to clip space

uniform float u_priceMax;
uniform float u_priceMin;

out float a_pricePoint;

void main() {
	// 1. Transform vertex from local object space to world space
	vec4 worldPosition = u_modelMatrix * a_position;

	// 2. Transform vertex from world space to camera (view) space
	vec4 viewPosition = u_viewMatrix * worldPosition;

	// 3. Transform vertex from camera space to clip space (for projection)
	gl_Position = u_projectionMatrix * viewPosition;

	float len = u_priceMax - u_priceMin;
	float delta = a_position[1] - u_priceMin;

	a_pricePoint = delta / len;
}
