#version 300 es

// Fragment shaders in WebGL2 require a default precision for floats.
// 'highp' provides high precision.
precision highp float;

uniform vec4 u_color;      // Model matrix: transforms from local to world space

// This declares the output variable for the fragment shader.
// 'outColor' will hold the final color of the fragment.
out vec4 outColor;

void main() {
	// Set the output color to solid red (RGBA: red, green, blue, alpha).
	// Values range from 0.0 to 1.0.
	outColor = u_color;
}
