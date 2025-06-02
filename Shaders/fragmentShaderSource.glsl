#version 300 es
precision mediump float;

in vec2 mTexCoords;
out vec4 fragColor;

uniform sampler2D textureDiffuse;

void main()
{
    fragColor = texture(textureDiffuse, mTexCoords);
}