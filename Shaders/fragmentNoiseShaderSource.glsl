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
    vec2 pos = st * 40.0;
    float n = noise(pos);

    float lineWidth = 0.2;
    float fadeOut = 0.0; //sharpness of connecting edges
    float speedMultiplier = 0.05;

    float bands = 5.0;
    float repeatNoise = fract(n * bands); //fract returns fractional portion of floating point number
    float lineCenter = abs(cos(time * speedMultiplier));

    float lines = smoothstep(lineWidth + fadeOut, 
                            lineWidth - fadeOut, 
                            abs(repeatNoise - lineCenter));

    FragColor = mix(vec4(19.0 / 255.0, 19.0 / 255.0, 20.0 / 255.0, 1.0), vec4(vec3(12.0 / 255.0, 12.0 / 255.0, 12.0 / 255.0), 1.0), lines);
}