#version 300 es
precision mediump float;

layout (location = 0) out vec4 fragColor;

struct Material 
{
	sampler2D textureDiffuse;
	sampler2D textureSpecular;
	sampler2D textureNormal;
	sampler2D textureEmission;
	float shininess;
	float alpha;
};

struct dirLight
{
	vec3 direction;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

struct pointLight 
{
	vec3 position;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float constant;
	float linear;
	float quadratic;
};

#define NR_POINT_LIGHTS 1

in vec3 fragPos;
in vec2 texCoords;
in mat3 tbn;

uniform Material material;
uniform dirLight mDirLight;
uniform pointLight mPointLights[NR_POINT_LIGHTS];
uniform vec3 viewPos;
uniform bool emissive;
uniform vec3 colorMultiplier;

vec3 calcPointLight(pointLight light, vec3 normal, vec3 fragPos, vec3 viewDir);
vec3 calcDirLight(dirLight light, vec3 normal, vec3 viewDir);

void main() 
{
	//Properties
	vec3 norm = texture(material.textureNormal, texCoords).rgb;
	norm = norm * 2.0 - 1.0;
	norm = normalize(tbn * norm);

	vec3 viewDir = normalize(viewPos - fragPos);

	//Direction Lights
	vec3 result = calcDirLight(mDirLight, norm, viewDir);

	//Point Lights
	//for (int i = 0; i < NR_POINT_LIGHTS; i++)
	//{
	//	result += calcPointLight(mPointLights[i], norm, fragPos, viewDir);
	//}

	//Emission
	const float emissionScaler = 4.0;

	if (emissive)
	{
		vec3 emission = texture(material.textureEmission, texCoords).rgb;
		result += emission * emissionScaler;
	}
	
	fragColor = vec4(result * colorMultiplier, material.alpha);
}

vec3 calcPointLight(pointLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
{
	vec3 lightDir = normalize(light.position - fragPos);
	//Diffuse
	float diff = max(dot(normal, lightDir), 0.0);
	//Specular
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	//Attenuation
	float distance = length(light.position - fragPos);
	float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
	//Combine
	vec3 ambient = light.ambient * vec3(texture(material.textureDiffuse, texCoords));
	vec3 diffuse = light.diffuse * diff * vec3(texture(material.textureDiffuse, texCoords));
	vec3 specular = light.specular * spec * vec3(texture(material.textureSpecular, texCoords));
	ambient *= attenuation; 
	diffuse *= attenuation;
	specular *= attenuation;
	return (ambient + diffuse + specular);
}

vec3 calcDirLight(dirLight light, vec3 normal, vec3 viewDir)
{
	vec3 lightDir = normalize(-light.direction);
	//Diffuse
	float diff = max(dot(normal, lightDir), 0.0);
	//Specular
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	//Combine
	vec3 ambient = light.ambient * vec3(texture(material.textureDiffuse, texCoords));
	vec3 diffuse = light.diffuse * diff * vec3(texture(material.textureDiffuse, texCoords));
	vec3 specular = light.specular * spec * vec3(texture(material.textureSpecular, texCoords));
	return (ambient + diffuse + specular);
}