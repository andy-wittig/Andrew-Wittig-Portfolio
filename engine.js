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

//Shaders
const mShader = new Shader("Shaders/vertexLightingShaderSource.glsl", "Shaders/fragmentLightingShaderSource.glsl");
const mPickingShader = new Shader("Shaders/vertexPickingShaderSource.glsl", "Shaders/fragmentPickingShaderSource.glsl");

//Objects
const mModel = new Object("Models/retro_tv.obj", "Textures/white_texture.png", null, "Textures/undefined_normal.png");
const mModel2 = new Object("Models/retro_tv.obj", "Textures/white_texture.png", null, "Textures/undefined_normal.png");
const mModel3 = new Object("Models/retro_tv.obj", "Textures/white_texture.png", null, "Textures/undefined_normal.png");

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
        const new_id = [(Math.floor(Math.random() * 255) + 1) / 255, 
                        (Math.floor(Math.random() * 255) + 1) / 255, 
                        (Math.floor(Math.random() * 255) + 1) / 255, 1.0];
        
        let isDuplicate = false;

        for (let i = 0; i < id_list.length; i++)
        {
            isDuplicate = checkDuplicate(new_id, id_list[i]);
            if (isDuplicate === true) { break; }
        }

        if (!isDuplicate)
        {
            id_list.push(new_id);
            console.log(new_id);
            return new_id;
        }
    }
}

let deltaTime = 0;
async function runEngine()
{
    //Init
    await mShader.Initialize();
    await mPickingShader.Initialize();

    await mModel.Initialize();
    await mModel2.Initialize();
    await mModel3.Initialize();    

    mModel.setID(assignUniqueID());
    mModel2.setID(assignUniqueID());
    mModel3.setID(assignUniqueID());

    mModel2.translate([4, 0, 0]);
    mModel3.translate([-4, 0, 0]);

    //WebGL Render Settings
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);

    //Camera
    const fieldOfView = (60 * Math.PI) / 180;
    const zNear = 0.1;
    const zFar = 100.0;
    const cameraPos = [new Float32Array([0, 2, 6]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0])]; //position, eye, up vector
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();

    function updateCamera()
    {
        const aspect = canvas.width / canvas.height;
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.lookAt(viewMatrix, cameraPos[0], cameraPos[1], cameraPos[2]);
    }

    function pickObjects()
    {
        const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
        const data = new Uint8Array(4);

        gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
        const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24) >>> 0;
        //console.log("x: " + pixelX + ", y: " + pixelY + ", data:" + data[0] + "," + data[1] + "," + data[2] + "," + data[3]);
        //console.log("\n" + id);

        return id;
    }

    function renderObjectPicking(shader, object, id)
    {
        var objectID = object.getID();
        var encodedObjectID = objectID[0] * 255 + (objectID[1] * 255 << 8) + (objectID[2] * 255 << 16) + (objectID[3] * 255 << 24) >>> 0;
        
        if (id == encodedObjectID) { gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), [objectID[0], objectID[1], objectID[2]]); }
        gl.uniformMatrix4fv(shader.getUniformLocation("modelMatrix"), false, object.getModelMatrix());
        object.render(shader);
        gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);
    }

    let mouseX = -1;
    let mouseY = -1;
    let prevTime = 0;
    
    function update(time) 
    {
        time *= 0.001; //convert to seconds
        deltaTime = time - prevTime;
        prevTime = time;

        updateCamera();

        //Render Picking Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, mPickingBuffer);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        mPickingShader.enableShader();

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
	    gl.uniformMatrix4fv(mPickingShader.getUniformLocation("viewMatrix"), false, viewMatrix);

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mModel.getModelMatrix());
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), mModel.getID()); 
        mModel.render();

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mModel2.getModelMatrix());
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), mModel2.getID()); 
        mModel2.render();

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mModel3.getModelMatrix());
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), mModel3.getID()); 
        mModel3.render();

        let pickID = pickObjects();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //Render Objects
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mShader.enableShader();
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.direction"), [0, -.8, -.8]);
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.ambient"), [.08, .08, .08]);
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.diffuse"), [.8, .8, .8]);
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.specular"), [.4, .4, .4]);
        
        gl.uniform3fv(mShader.getUniformLocation("viewPos"), cameraPos[0]);
        gl.uniformMatrix4fv(mShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mShader.getUniformLocation("viewMatrix"), false, viewMatrix);
        gl.uniform1f(mShader.getUniformLocation("material.alpha"), 1.0);
        gl.uniform1f(mShader.getUniformLocation("material.shininess"), 40.0);
        gl.uniform3fv(mShader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);

        renderObjectPicking(mShader, mModel, pickID);
        renderObjectPicking(mShader, mModel2, pickID);
        renderObjectPicking(mShader, mModel3, pickID);

        //Update Model Positions
        const rotationScalar = 0.1;
        mModel.rotate(deltaTime * rotationScalar, [0, 1, 0]);
        mModel2.rotate(deltaTime * rotationScalar, [0, 1, 0]);
        mModel3.rotate(deltaTime * rotationScalar, [0, 1, 0]);
        const sinAmplitude = 0.0005;
        const sinFreqency = 1.2;
        mModel.translate([0, Math.sin(time * sinFreqency) * sinAmplitude, 0]);
        mModel2.translate([0, Math.sin(time * sinFreqency) * sinAmplitude, 0]);
        mModel3.translate([0, Math.sin(time * sinFreqency) * sinAmplitude, 0]);

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    gl.canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        //console.log("x: " + mouseX + ", y: " + mouseY);
     });
}

try
{
    runEngine();
}
catch (e)
{
    console.log(`Uncaught JavaScript exception: ${e}`);
}