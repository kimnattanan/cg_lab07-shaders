#version 450
#extension GL_GOOGLE_include_directive : require

#include <shadertoy.glsl>
#include <noise.glsl>

float sdf_circle(vec2 p, float r) { return length(p) - r; }

float sdf_rounded_box(vec2 p, vec2 hs, float r) {
  vec2 q = abs(p) - (hs - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float op_smooth_union(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.y;
  vec2 m = (2.0 * iMouse.xy - iResolution.xy) / iResolution.y;

  vec2 orbit = vec2(0.45 * cos(iTime), 0.28 * sin(iTime * 0.7));
  float moon = sdf_circle(p - orbit, 0.18);

  vec2 ballC = mix(vec2(-0.15, 0.10), m, iMouse.z);
  float ball = sdf_circle(p - ballC, 0.22);

  float dock = sdf_rounded_box(p - vec2(0.0, -0.45), vec2(0.70, 0.07), 0.07);

  float d = op_smooth_union(moon, ball, 0.15);
  d = min(d, dock);

  float n = fbm(p * 1.6 + vec2(iTime * 0.04, 0.0), 4u);
  vec3 sky = mix(vec3(0.02, 0.04, 0.10), vec3(0.20, 0.35, 0.55), n);

  float edge = smoothstep(fwidth(d), -fwidth(d), d);
  vec3 col = mix(sky, vec3(0.95, 0.78, 0.40), edge);

  if      (iMode == 1u) col = vec3(clamp(d * 0.5 + 0.5, 0.0, 1.0));
  else if (iMode == 2u) col = vec3(n);
  else if (iMode == 3u) col = vec3(iMouse.z, m * 0.5 + 0.5);

  fragColor = vec4(col, 1.0);
}