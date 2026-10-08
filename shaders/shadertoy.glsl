#ifndef SHADERTOY_GLSL_INCLUDED
#define SHADERTOY_GLSL_INCLUDED

#include <toy.glsl>
// #include <iostream>

#define iResolution vec3(u.resolution, 1.0)
#define iTime       u.time
#define iMouse      vec4(u.mouse.x, u.resolution.y - u.mouse.y, u.mouse.z, 0.0)
#define iMode       u.mode

layout(location = 0) out vec4 outColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
  // std::cout<<(vec2(0,0)).length()<<std::endl;
  mainImage(outColor, vec2(gl_FragCoord.x, u.resolution.y - gl_FragCoord.y));
}

#endif
