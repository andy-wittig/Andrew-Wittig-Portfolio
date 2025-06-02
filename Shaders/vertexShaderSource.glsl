#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 texCoords;

out vec2 mTexCoords;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main()
{
    mTexCoords = texCoords;
    gl_Position = (projectionMatrix * viewMatrix * modelMatrix) * vec4(vertexPosition, 1.0);
}