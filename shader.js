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

        try {
            //Load Shaders From File
            this.vertexShaderText = await loadShaderFile(this.vertexShaderPath);
            this.fragmentShaderText = await loadShaderFile(this.fragmentShaderPath);
            
            //Compile Shaders
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            if (vertexShader === null)
            {
                throw new Error("Failed to create vertex shader");
            }

            gl.shaderSource(vertexShader, this.vertexShaderText);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
            {
                const compileError = gl.getShaderInfoLog(vertexShader);
                throw new Error(`Failed to compile vertex shader: ${compileError}`);
            }

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            if (fragmentShader === null)
            {
                throw new Error("Failed to create fragment shader");
            }

            gl.shaderSource(fragmentShader, this.fragmentShaderText);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
            {
                const compileError = gl.getShaderInfoLog(fragmentShader);
                throw new Error(`Failed to compile fragment shader: ${compileError}`);
            }

            //Link Shaders
            gl.attachShader(this.shaderProgram, vertexShader);
            gl.attachShader(this.shaderProgram, fragmentShader);
            gl.linkProgram(this.shaderProgram);
            if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
            {
                const linkError = gl.getProgramInfoLog(this.shaderProgram);
                throw new Error(`Failed to link shaders: ${linkError}`);
            }

            //Free Memory
            gl.detachShader(this.shaderProgram, vertexShader);
            gl.detachShader(this.shaderProgram, fragmentShader);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
        }
        catch (err)
        {
            console.error(err);
            throw err;
        }
    }

    getAttribLocation(attribName)
    {
        const location = gl.getAttribLocation(this.shaderProgram, attribName);
        if (location < 0)
        {
            console.error(`Failed to get attribute location for: ${attribName}`);
        }
        return location;
    }

    getUniformLocation(uniformName)
    {
        const location = gl.getUniformLocation(this.shaderProgram, uniformName);
        if (location === null)
        {
            console.error(`Failed to get uniform location for: ${uniformName}`);
        }
        return location;
    }

    enableShader()
    {
        if (this.shaderProgram)
        {
            gl.useProgram(this.shaderProgram);
        }
        else
        {
            console.error("There was no shader found to be enabled.");
        }
    }

    destroyShader()
    {
        if (this.shaderProgram)
        {
            gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }
    }
}