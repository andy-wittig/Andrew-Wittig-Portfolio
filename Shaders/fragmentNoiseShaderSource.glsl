#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform vec2 resolution;
uniform float time;

float random (in vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise (in vec2 st)
{
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    //Cubic Hermine Curve
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    //Mix corners
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main()
{
    vec2 st = TexCoords.xy;
    vec2 pos = st * 35.0 + vec2(time * 0.25, 0.0);
    float n = noise(pos);

    float glow = smoothstep(0.05, 0.04, abs(n - 0.5));
    FragColor = mix(vec4(19.0 / 255.0, 19.0 / 255.0, 20.0 / 255.0, 1.0), vec4(vec3(30.0 / 255.0, 30.0 / 255.03, 36.0 / 255.0), 1.0), glow);
}