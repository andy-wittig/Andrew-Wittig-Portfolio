 import gl from "./engine.js";
 
 async function loadShaderFile(shaderPath)
{
    const shaderText = await fetch(shaderPath).then(result => result.text());
    return shaderText;
}

export default class Shader
{
    constructor(vertexShaderPath, fragmentShaderPath)
    {
        this.vertexShaderPath = vertexShaderPath;
        this.fragmentShaderPath = fragmentShaderPath;
    }

    async Initialize()
    {
        this.shaderProgram = gl.createProgram();

        //Load Shaders From File
        this.vertexShaderText = await loadShaderFile(this.vertexShaderPath);
        this.fragmentShaderText = await loadShaderFile(this.fragmentShaderPath);
        //console.log(this.vertexShaderText);
        //console.log(this.fragmentShaderText);
        
        //Compile Shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (vertexShader === null)
        {
            console.log("Failed to create vertex shader");
            return;
        }

        gl.shaderSource(vertexShader, this.vertexShaderText);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        {
            const compileError = gl.getShaderInfoLog(vertexShader);
            console.log(`Failed to compile vertex shader: ${compileError}`);
            return;
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (fragmentShader === null)
        {
            console.log("Failed to create fragment shader");
            return;
        }

        gl.shaderSource(fragmentShader, this.fragmentShaderText);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        {
            const compileError = gl.getShaderInfoLog(fragmentShader);
            console.log(`Failed to compile fragment shader: ${compileError}`);
            return;
        }

        //Link Shaders
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
        {
            const linkError = gl.getProgramInfoLog(this.shaderProgram);
            console.log(`Failed to link shaders: ${linkError}`);
            return;
        }

        //Free Memory
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }

    getAttribLocation(attribName)
    {
        const location = gl.getAttribLocation(this.shaderProgram, attribName);
        if (location < 0)
        {
            console.log(`Failed to get attribute location for: ${attribName}`);
        }
        return location;
    }

    getUniformLocation(uniformName)
    {
        const location = gl.getUniformLocation(this.shaderProgram, uniformName);
        if (location === null)
        {
            console.log(`Failed to get uniform location for: ${uniformName}`);
        }
        return location;
    }

    enableShader()
    {
        gl.useProgram(this.shaderProgram);
    }
}