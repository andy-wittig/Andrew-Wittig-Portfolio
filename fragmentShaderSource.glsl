#version 300 es
precision mediump float;

in vec2 mTexCoords;
in vec3 mNormal;
in vec3 mFragPos;

out vec4 fragColor;

uniform sampler2D textureDiffuse;

void main()
{
    fragColor = texture(textureDiffuse, mTexCoords);
}