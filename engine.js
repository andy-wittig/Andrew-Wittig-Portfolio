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
const mShader = new Shader("Shaders/vertexLightingShaderSource.glsl", "Shaders/fragmentLightingShaderSource.glsl");
const mModel = new Object("Models/obelisk.obj", "Textures/slate_diffuse2.png", null, "Textures/slate_normal.png");

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
    gl.depthFunc(gl.LESS);

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
    const cameraPos = [[0, 6, 8], [0, 2, 0], [0, 1, 0]];
    mat4.lookAt(viewMatrix, cameraPos[0], cameraPos[1], cameraPos[2]);

    //Setup GPU program
    mShader.enableShader();
    gl.uniform3fv(mShader.getUniformLocation("viewPos"), cameraPos[0]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.direction"), [-1, 0, 0]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.ambient"), [.08, .08, .08]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.diffuse"), [1, 1, 1]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.specular"), [.8, .8, .8]);

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
	gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);

    let then = 0;

    function update(now) 
    {
        now *= 0.001; //convert to seconds
        deltaTime = now - then;
        then = now;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //Render Objects
        mShader.enableShader();
        gl.uniform1f(mShader.getUniformLocation("material.alpha"), 1.0);
        gl.uniform1f(mShader.getUniformLocation("material.shininess"), 40.0);
        gl.uniformMatrix4fv(modelMatrixLocation, false, mModel.getModelMatrix());
        mModel.render(mShader);

        //Update Position
        mModel.rotate(deltaTime * 0.2, [0, 1, 0]);

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