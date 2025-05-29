function showError(errorText)
{
    const errorBoxDiv = document.getElementById("error-box");
    const errorTextElem = document.createElement("p");
    errorTextElem.innerText = errorText;
    errorBoxDiv.appendChild(errorTextElem);
    console.log(errorText);
}

function runEngine()
{
    const canvas = document.getElementById("demo-canvas");
    if (!canvas)
    {
        showError("Cannot get canvas reference.");
        return;
    }

    const gl = canvas.getContext("webgl2");
    if (!gl)
    {
        showError("This browser doesn't support WebGL 2.");
        return;
    }

    const triangleVertices = [
        0.0, 0.5,
        -0.5, -0.5,
        0.5, -0.5
    ];
    const triangleVerticesCpuBuffer = new Float32Array(triangleVertices);

    const triangleGeoBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCpuBuffer, gl.STATIC_DRAW);

    const vertexShaderSource = `#version 300 es
    precision mediump float;

    in vec2 vertexPosition;

    void main()
    {
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }`;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
    {
        const compileError = gl.getShaderInfoLog(vertexShader);
        showError(`Failed to compile vertex shader: ${compileError}`);
        return;
    }

    const fragmentShaderSource = `#version 300 es
    precision mediump float;

    out vec4 outputColor;

    void main()
    {
        outputColor = vec4(0.294, 0.0, 0.51, 1.0);
    }`;
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
    {
        const compileError = gl.getShaderInfoLog(fragmentShader);
        showError(`Failed to compile fragment shader: ${compileError}`);
        return;
    }

    const triangleShaderProgram = gl.createProgram();
    gl.attachShader(triangleShaderProgram, vertexShader);
    gl.attachShader(triangleShaderProgram, fragmentShader);
    gl.linkProgram(triangleShaderProgram);
    if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS))
    {
        const linkError = gl.getProgramInfoLog(triangleShaderProgram);
        showError(`Failed to link shaders: ${linkError}`);
        return;
    }
    const vertexPositionAttribute = gl.getAttribLocation(triangleShaderProgram, "vertexPosition");
    if (vertexPositionAttribute < 0)
    {
        showError("Failed to get attribute location for vertexPosition.");
        return;
    }

    //Output Merger
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.08, 0.08, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Rasterizer
    gl.viewport(0, 0, canvas.width , canvas.height);

    //Setup GPU program
    gl.useProgram(triangleShaderProgram);
    gl.enableVertexAttribArray(vertexPositionAttribute);

    //Input Assembler
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false,  2 * Float32Array.BYTES_PER_ELEMENT, 0);

    //Draw call
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

try
{
    runEngine();
}
catch (e)
{
    showError(`Uncaught JavaScript exception: ${e}`);
}