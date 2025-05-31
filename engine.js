//Imports
import Shader from "./shader.js"
import Object from "./object.js"

//Get WebGL Context
const canvas = document.getElementById("demo-canvas");
if (!canvas)
{
    showError("Cannot get canvas reference.");
}

const gl = canvas.getContext("webgl2");
if (!gl)
{
    showError("This browser doesn't support WebGL 2.");
}

export default gl;

//Objects
const mShader = new Shader("vertexShaderSource.glsl", "fragmentShaderSource.glsl");
const mModel = new Object("cube.obj");

function showError(errorText)
{
    console.log(errorText);
    const errorBoxDiv = document.getElementById("error-box");
    const errorTextElem = document.createElement("p");
    errorTextElem.innerText = errorText;
    errorBoxDiv.appendChild(errorTextElem);
}

let deltaTime = 0;

async function runEngine()
{
    await mShader.Initialize();
    await mModel.Initialize();

    //Attibute and Uniform Positions
    const projectionMatrixLocation = mShader.getUniformLocation("projectionMatrix");
    const viewMatrixLocation = mShader.getUniformLocation("viewMatrix");
    const modelMatrixLocation = mShader.getUniformLocation("modelMatrix");

    //Output Merger
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    //gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //Rasterizer
    gl.viewport(0, 0, canvas.width , canvas.height);

    //Camera
    const fieldOfView = (60 * Math.PI) / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 4, 6], [0, 1, 0], [0, 1, 0]);

    //Setup GPU program
    mShader.enableShader();
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
	gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
	

    let then = 0;

    function update(now) 
    {
        now *= 0.001; //convert to seconds
        deltaTime = now - then;
        then = now;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mModel.rotate(deltaTime, [0, 1, 0]);

        gl.uniformMatrix4fv(modelMatrixLocation, false, mModel.getModelMatrix());
        mModel.render(mShader);

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

try
{
    runEngine();
}
catch (e)
{
    showError(`Uncaught JavaScript exception: ${e}`);
}