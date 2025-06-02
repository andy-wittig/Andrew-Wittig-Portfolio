//Imports
import Shader from "./shader.js"
import Object from "./object.js"

//Get WebGL Context
const canvas = document.getElementById("demo-canvas");
if (!canvas)
{
    console.log("Cannot get canvas reference.");
}

const gl = canvas.getContext("webgl2");
if (!gl)
{
    console.log("This browser doesn't support WebGL 2.");
}
export default gl;

function resizeCanvas()
{
    canvas.width = gl.canvas.clientWidth;
    canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, canvas.width , canvas.height);
    setFrameBufferAttatchmentSize(canvas.width, canvas.height);
}

//Objects
const mShader = new Shader("Shaders/vertexLightingShaderSource.glsl", "Shaders/fragmentLightingShaderSource.glsl");
const mPickingShader = new Shader("Shaders/vertexPickingShaderSource.glsl", "Shaders/fragmentPickingShaderSource.glsl");
const mModel = new Object("Models/obelisk.obj", "Textures/slate_diffuse2.png", null, "Textures/slate_normal.png");

//Custom Frame Buffers
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

//depth renderbuffer
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFrameBufferAttatchmentSize(width, height)
{
    gl.bindTexture(gl.TEXTURE_2D, targetTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
}

//create and bind frame buffer
const mPickingBuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, mPickingBuffer);

gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

function checkDuplicate(array1, array2)
{
    if (array1.length !== array2.length) { return false; }

    for (let i = 0; i < array1.length; i++)
    {
        if (array1[i] !== array2[i]) { return false; }
    }
    
    return true;
}

let id_list = [];
function assignUniqueID()
{
    while (true)
    {
        const new_id = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255.0];

        let isDuplicate = false;

        for (let i = 0; i < id_list.length; i++)
        {
            isDuplicate = checkDuplicate(new_id, id_list[i]);
            if (isDuplicate === true) { break; }
        }

        if (!isDuplicate)
        {
            id_list.push(new_id);
            return new_id;
        }
    }
}

let deltaTime = 0;
async function runEngine()
{
    await mShader.Initialize();
    await mPickingShader.Initialize();
    await mModel.Initialize();

    //Attibute and Uniform Positions
    const projectionMatrixLocation = mShader.getUniformLocation("projectionMatrix");
    const viewMatrixLocation = mShader.getUniformLocation("viewMatrix");

    //Output Merger
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    //WebGL Render Settings
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);

    //Camera
    const fieldOfView = (60 * Math.PI) / 180;
    const zNear = 0.1;
    const zFar = 100.0;

    var projectionMatrix = mat4.create();
    var viewMatrix = mat4.create();

    function updateCamera()
    {
        var aspect = canvas.width / canvas.height;
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        var cameraPos = [[0, 6, 8], [0, 2, 0], [0, 1, 0]];
        mat4.lookAt(viewMatrix, cameraPos[0], cameraPos[1], cameraPos[2]);

        mShader.enableShader();
        gl.uniform3fv(mShader.getUniformLocation("viewPos"), cameraPos[0]);
        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    }

    //Setup GPU program
    mShader.enableShader();
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.direction"), [-1, 0, 0]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.ambient"), [.08, .08, .08]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.diffuse"), [1, 1, 1]);
    gl.uniform3fv(mShader.getUniformLocation("mDirLight.specular"), [.8, .8, .8]);

    let then = 0;
    function update(now) 
    {
        now *= 0.001; //convert to seconds
        deltaTime = now - then;
        then = now;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //Render Picking Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, mPickingBuffer);
        //gl.viewport(0, 0, canvas.width , canvas.height); might cause visual bugs
        
        mPickingShader.enableShader();
        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mModel.getModelMatrix());
        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
	    gl.uniformMatrix4fv(mPickingShader.getUniformLocation("viewMatrix"), false, viewMatrix);
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), assignUniqueID());
        mModel.render();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //Render Objects
        mShader.enableShader();
        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mModel.getModelMatrix());
        gl.uniform1f(mShader.getUniformLocation("material.alpha"), 1.0);
        gl.uniform1f(mShader.getUniformLocation("material.shininess"), 40.0);
        mModel.render(mShader);

        //Update Model Positions
        mModel.rotate(deltaTime * 0.2, [0, 1, 0]);

        //Update Camera
        updateCamera();

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
    console.log(`Uncaught JavaScript exception: ${e}`);
}