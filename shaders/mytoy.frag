#version 450
#extension GL_GOOGLE_include_directive : require

#include <shadertoy.glsl>
#include <noise.glsl>


float sdf_circle(vec2 p, float r)      { return length(p) - r; }
float sdf_box(vec2 p, vec2 hs) {
  vec2 q = abs(p) - hs;
  return length(max(q,0.0)) + min(max(q.x,q.y),0.0);
}
float sdf_rounded_box(vec2 p, vec2 hs, float r) {
  return sdf_box(p,hs-r)-r;
}
float op_smooth_union(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
  return mix(d2,d1,h) - k*h*(1.0-h);
}


float scene(vec2 p){
  return sdf_rounded_box(p-vec2(0,0),vec2(0.5,0.5),0.1);
}


const vec3 bg_color = vec3(0,0,0);
const vec3 ball_color1 = vec3(1,0,0);
const vec3 ball_color2 = vec3(1,1,0);
const float ball_radius = 0.1;
const float fx_speed = 1;
const int fx_loop_k = 5;
const float fx_loop_t = 1;
const float fx_dir_change_ratio = 0.3;
const vec3 glow_color = vec3(1,1,1);

float calc_fx_radius(float t, int i, int j) {
  uvec2 id = uvec2(uint(i + fx_loop_k), uint(j + fx_loop_k));
  float r = hash(id + uvec2(19u, 47u)) * ball_radius;
  return mix(r, 0.0, t);
}

float map_time(int i, int j) {
  uvec2 id = uvec2(uint(i + fx_loop_k), uint(j + fx_loop_k));
  return hash(id) * fx_loop_t;
}

vec2 calc_fx_center(float t, int i, int j, vec2 m) {
  vec2 dir0 = normalize(vec2(i, j));
  float t0 = fx_dir_change_ratio * fx_loop_t;
  if (t <= t0) {
    return dir0 * fx_speed * t;
  }

  float remain = fx_loop_t - t0;
  vec2 b0 = dir0 * fx_speed * t0;
  vec2 b1 = b0 + dir0 * (fx_speed * remain * 0.5);
  vec2 b2 = m;
  float u = (t - t0) / remain;
  float s = 1.0 - u;
  return s*s*b0 + 2.0*s*u*b1 + u*u*b2;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.y;
  vec2 m = (2.0 * iMouse.xy - iResolution.xy) / iResolution.y;

  bool is_mouse_pressed = iMouse.z > 0.5;

  float d = length(p);
  for(int i=-fx_loop_k;i<=fx_loop_k;++i){
    for(int j=-fx_loop_k;j<=fx_loop_k;++j){
      // vec2 dir = mix(normalize(vec2(i,j)),m.xy,(iMouse.z > 0.5 ? 1 : 0));
      if (i == 0 && j == 0) continue;
      float phase = map_time(i, j);
      float t = mod(iTime + phase, fx_loop_t);
      vec2 dir = normalize(vec2(i,j));
      vec2 fx_center = t * dir * fx_speed;
      if(is_mouse_pressed){
        dir = normalize(m.xy);
        fx_center = calc_fx_center(t, i, j, m);
      }
      float fx_radius = calc_fx_radius(t,i,j);
      float fx = sdf_rounded_box(p-fx_center, vec2(fx_radius), 0.05);
      d = op_smooth_union(d,fx,0.1);
    }
  }

  float n = fbm(p * 0.5 + 1 * (iTime+10) * vec2(0,1), 6u);

  float edge = smoothstep(fwidth(d), -fwidth(d), d);
  vec3 ball_color = mix(ball_color1, ball_color2, n);
  // vec3 col = mix(bg_color, ball_color, edge);
  vec3 col = bg_color;
  col += ball_color * 0.4 * exp(-max(d, 0.0) / 0.04); // wide
  col += glow_color * 0.8 * exp(-max(d, 0.0) / 0.015); // tight
  col = mix(col, ball_color, edge);

  if (iMode == 1u) col = vec3(clamp(d * 0.5 + 0.5, 0.0, 1.0));
  else if (iMode == 2u) col = vec3(n);
  else if (iMode == 3u) col = vec3(iMouse.z, m * 0.5 + 0.5);

  fragColor = vec4(col, 1.0);
}
