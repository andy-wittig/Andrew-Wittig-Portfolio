#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec3 vertexNormal;
layout (location = 2) in vec2 vertexTexCoords;
layout (location = 3) in vec3 vertexTangent;

out vec3 fragPos;
out vec2 texCoords;
out mat3 tbn;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main()
{
    mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));
    vec3 n = normalize(normalMatrix * vertexNormal);
    vec3 t = normalize(normalMatrix * vertexTangent);
    vec3 b = normalize(cross(t, n));
    tbn = mat3(t, b, n);
    fragPos = vec3(modelMatrix * vec4(vertexPosition, 1.0));

	texCoords = vertexTexCoords;

	gl_Position = projectionMatrix * viewMatrix * vec4(fragPos, 1.0);
}