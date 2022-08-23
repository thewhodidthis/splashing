export const vertex = `#version 300 es
in vec2 aPosition;

uniform vec2 uResolution;

out vec2 vTextureCoord;

void main() {
  // Convert from pixels to 0 -> 1.
  vTextureCoord = aPosition / uResolution;

  gl_Position = vec4(((vTextureCoord * 2.0) - 1.0) * vec2(1, -1), 0, 1);
}`

export const fragment = `#version 300 es
precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float uThreshold;

out vec4 oColor;

void main() {
  vec4 c = texture(uSampler, vTextureCoord);
  float metaball = c.a > uThreshold ? 1.0 : 0.0;

  c.a = metaball;
  c.rgb = c.rgb * metaball;

  oColor = c;
}`
