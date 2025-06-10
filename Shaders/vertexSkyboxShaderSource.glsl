#version 300 es
precision mediump float;

layout (location = 0) in vec3 aPos;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec3 localPos;

void main()
{
    localPos = aPos;

    mat4 rotView = mat4(mat3(viewMatrix));
    vec4 clipPos = projectionMatrix * rotView * vec4(localPos, 1.0);

    gl_Position = clipPos.xyww;
}