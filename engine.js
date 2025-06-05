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

//Monitor Text HTML Integration
const divOverlayElement = document.getElementById("overlay");
const typewriterElement = document.getElementById("typewriter");

const divMonitorElement = document.createElement("div");
const divMonitorName = document.createElement("div");
const divMonitorDesc = document.createElement("div");
divMonitorElement.className = "floating-div";

divMonitorElement.append(divMonitorName);
divMonitorElement.append(divMonitorDesc);
divOverlayElement.append(divMonitorElement);

//Shaders
const mShader = new Shader("Shaders/vertexLightingShaderSource.glsl", "Shaders/fragmentLightingShaderSource.glsl");
const mPickingShader = new Shader("Shaders/vertexPickingShaderSource.glsl", "Shaders/fragmentPickingShaderSource.glsl");

//Objects
const mMonitor = new Object("Models/retro_tv.obj", "Textures/tv_diffuse.png", null, "Textures/tv_normal.png");
const mMonitor2 = new Object("Models/retro_tv.obj", "Textures/tv_diffuse.png", null, "Textures/tv_normal.png");
const mMonitor3 = new Object("Models/retro_tv.obj", "Textures/tv_diffuse.png", null, "Textures/tv_normal.png");

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
            return new_id;
        }
    }
}

function degToRad(degrees)
{
    return (degrees * Math.PI) / 180.0;
}

function radToDeg(rads)
{
    return rads * (180.0 / Math.PI);
}

let deltaTime = 0;
async function runEngine()
{
    //Init
    await mShader.Initialize();
    await mPickingShader.Initialize();

    await mMonitor.Initialize();
    await mMonitor2.Initialize();
    await mMonitor3.Initialize();    

    mMonitor.setID(assignUniqueID());
    mMonitor2.setID(assignUniqueID());
    mMonitor3.setID(assignUniqueID());

    mMonitor.setName("<b>Who am I?</b>");
    mMonitor.setDescription("Driven to creating emmersive experiences with stunning visuals.");
    mMonitor2.setName("<b>Projects</b>");
    mMonitor2.setDescription(`
    <ul>
    <li>Project 1</li>
    <li>Project 2</li>
    <li>Project 3</li>
    </ul> 
    `);
    mMonitor3.setName("<b>Skills</b>");
    mMonitor3.setDescription(`
    <ul>
    <li>C++</li>
    <li>WebGL, OpenGL</li>
    <li>Javascript, HTML, CSS</li>
    </ul> 
    `);

    mMonitor.rotate((0 * Math.PI) / 180, [0, 1, 0]);
    mMonitor2.rotate((45 * Math.PI) / 180, [0, 1, 0]);
    mMonitor3.rotate((-45 * Math.PI) / 180, [0, 1, 0]);

    const objectPositionRadius = 5;

    mMonitor.translate([0, 0, objectPositionRadius]);
    mMonitor2.translate([0, 0, objectPositionRadius]);
    mMonitor3.translate([0, 0, objectPositionRadius]);

    //WebGL Render Settings
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);

    //Camera
    let firstClick = false;
    const fieldOfView = (60 * Math.PI) / 180;
    const zNear = 0.1;
    const zFar = 100.0;
    const cameraRadius = 10;
    const cameraStartRadius = 12;
    const cameraStartingPosition = [(cameraStartRadius) * Math.sin(degToRad(0)), 2.0, (cameraStartRadius) * Math.cos(degToRad(0))];
    const cameraStartingEye = [mMonitor.getPosition()[0], -2.0, mMonitor.getPosition()[1]];
    const cameraPos = [cameraStartingPosition,
                       cameraStartingEye,
                       new Float32Array([0, 1, 0])]; //position, eye, up vector

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();

    function resizeCanvas()
    {
        canvas.width = gl.canvas.clientWidth;
        canvas.height = gl.canvas.clientHeight;

        gl.viewport(0, 0, canvas.width , canvas.height);
        setFrameBufferAttatchmentSize(canvas.width, canvas.height);
    }

    function updateCamera()
    {
        const aspect = canvas.width / canvas.height;
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.lookAt(viewMatrix, cameraPos[0], cameraPos[1], cameraPos[2]);
    }

    var selectedObject = mMonitor;

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

    let animStepRotation = 0;
    let animStepPosition = [0, 0, 0];
    let animStepRadius = 0;
    let animStartRotation = 0;
    let animStartPosition = 0;
    let animStartRadius = 0;
    let animRotationFinal = 0;
    let animPositionFinal = 0;
    let animRadiusFinal = 0;
    let startCameraAnim = false;
    let isLeftMouseDown = false;
    let animProgress = 0;

    function easeInOut(t)
    {
        if (t <= 0.5)
        {
            return 2.0 * t * t;
        }
        t -= 0.5;
        return 2.0 * t * (1.0 - t) + 0.5;
    }
    
    function cameraAnimate(degree, position, radius)
    {
        const animDuration = 3;
        animProgress += deltaTime / animDuration;
        animProgress = Math.min(animProgress, 1);

        const easedProgress = easeInOut(animProgress);

        animStepRotation = animStartRotation + (degree - animStartRotation) * easedProgress;
        animStepRadius = animStartRadius + (radius - animStartRadius) * easedProgress;
        animStepPosition[0] = animStartPosition[0] + (position[0] - animStartPosition[0]) * easedProgress;
        animStepPosition[1] = animStartPosition[1] + (position[1] - animStartPosition[1]) * easedProgress;
        animStepPosition[2] = animStartPosition[2] + (position[2] - animStartPosition[2]) * easedProgress;

        cameraPos[0][0] = animStepRadius * Math.sin(degToRad(animStepRotation));
        cameraPos[0][1] = 2.0;
        cameraPos[0][2] = animStepRadius * Math.cos(degToRad(animStepRotation));
        cameraPos[1][0] = animStepPosition[0];
        cameraPos[1][1] = animStepPosition[1];
        cameraPos[1][2] = animStepPosition[2];

        if (animProgress == 1) 
        {
            startCameraAnim = false;
        }
    }

    function renderObjectPicking(shader, object, id)
    {
        var objectID = object.getID();
        var encodedObjectID = objectID[0] * 255 + (objectID[1] * 255 << 8) + (objectID[2] * 255 << 16) + (objectID[3] * 255 << 24) >>> 0;
        
        if (id == encodedObjectID) 
        {
            if (isLeftMouseDown && !startCameraAnim && (selectedObject !== object || !firstClick))
            {
                //get y objects rotation and position
                const rotationQuat = object.getRotation();
                const angleY = Math.atan2(2 * (rotationQuat[3] * rotationQuat[1] + rotationQuat[0] * rotationQuat[2]),
                                        1 - 2 * (rotationQuat[1] * rotationQuat[1] + rotationQuat[2] * rotationQuat[2]));
                animRotationFinal = Math.round(radToDeg(angleY));
                animPositionFinal = object.getPosition();
                animRadiusFinal = cameraRadius;
                selectedObject = object;

                if (!firstClick)
                {
                    startCameraAnim = true;
                    animStartRotation = 0.0;
                    animStartPosition = [...cameraStartingEye];
                    animStartRadius = cameraStartRadius;
                    animProgress = 0;
                    firstClick = true;
                }
                else
                {
                    startCameraAnim = true;
                    animStartRotation = animStepRotation;
                    animStartPosition = animStepPosition;
                    animStartRadius = cameraRadius;
                    animProgress = 0;
                }
            }
            const selectColor = [1.4, 1.4, 1.4];
            gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), selectColor);
            //gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), [objectID[0], objectID[1], objectID[2]]); debugging
        }
        gl.uniformMatrix4fv(shader.getUniformLocation("modelMatrix"), false, object.getModelMatrix());
        object.render(shader);
        gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);
    }

    let showDescription = false;

    function renderMonitorText()
    {
        const point = [0, 0.4, 0, 1];

        var worldPosition = vec4.create();
        vec4.transformMat4(worldPosition, point, selectedObject.getModelMatrix());

        var viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

        var clipspace = vec4.create();
        vec4.transformMat4(clipspace, worldPosition, viewProjectionMatrix);

        clipspace[0] /= clipspace[3];
        clipspace[1] /= clipspace[3];

        var pixelTextX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width;
        var pixelTextY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

        const name = selectedObject.getName();
        const desc = selectedObject.getDescription();
        divMonitorName.innerHTML = name;
        divMonitorDesc.innerHTML = desc;

        const referenceHeight = 1080;
        const baseFontSize = 24;
        const baseElementWidth = 320;

        const screenRatio = canvas.height / referenceHeight;
        var newFontSize = baseFontSize * screenRatio;
        var newElementWidth = baseElementWidth * screenRatio;

        divMonitorElement.style.fontSize = `${newFontSize}px`;
        divMonitorElement.style.width = `${newElementWidth}px`;

        divMonitorElement.style.left = Math.floor(pixelTextX - divMonitorElement.offsetWidth / 2) + "px";
        divMonitorElement.style.top = Math.floor(pixelTextY) + "px";

        if (startCameraAnim == false && firstClick) 
        {
            const stylesheet = document.styleSheets[0];
            for (let i = stylesheet.cssRules.length - 1; i >= 0 ; i--)
            {
                const currentRule = stylesheet.cssRules[i];
                if (currentRule.type == CSSRule.KEYFRAMES_RULE && currentRule.name == "typewriter")
                {
                    stylesheet.deleteRule(i);
                }
            }

            var formattedName = name.replace(/<b>/g, "").replace(/<\/b>/g, "");

            stylesheet.insertRule(`
                @keyframes typewriter
                {
                    from { width: 0; }
                    to { width: ${formattedName.length}ch; }
                }
            `, stylesheet.cssRules.length);

            divMonitorName.classList.remove("anim_typewriter");
            divMonitorName.classList.add("anim_typewriter");
            divMonitorName.style.visibility = "visible";

            if (showDescription)
            {
                divMonitorDesc.classList.remove("anim_fadein");
                divMonitorDesc.classList.add("anim_fadein");
                divMonitorDesc.style.visibility = "visible";
            }
        }
        else
        {
            divMonitorName.style.visibility = "hidden";
            divMonitorDesc.style.visibility = "hidden";
            divMonitorName.classList.remove("anim_typewriter");
            divMonitorDesc.classList.remove("anim_fadein");
            showDescription = false;
        }
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
        if (startCameraAnim) { cameraAnimate(animRotationFinal, animPositionFinal, animRadiusFinal); }

        //Render Picking Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, mPickingBuffer);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        mPickingShader.enableShader();

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
	    gl.uniformMatrix4fv(mPickingShader.getUniformLocation("viewMatrix"), false, viewMatrix);

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mMonitor.getModelMatrix());
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), mMonitor.getID()); 
        mMonitor.render();

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mMonitor2.getModelMatrix());
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), mMonitor2.getID()); 
        mMonitor2.render();

        gl.uniformMatrix4fv(mPickingShader.getUniformLocation("modelMatrix"), false, mMonitor3.getModelMatrix());
        gl.uniform4fv(mPickingShader.getUniformLocation("id"), mMonitor3.getID()); 
        mMonitor3.render();

        let pickID = pickObjects();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //Render Objects
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mShader.enableShader();
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.direction"), [0, -1, -1]);
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.ambient"), [.08, .08, .08]);
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.diffuse"), [.6, .6, .6]);
        gl.uniform3fv(mShader.getUniformLocation("mDirLight.specular"), [.4, .4, .4]);
        
        gl.uniform3fv(mShader.getUniformLocation("viewPos"), cameraPos[0]);
        gl.uniformMatrix4fv(mShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mShader.getUniformLocation("viewMatrix"), false, viewMatrix);
        gl.uniform1f(mShader.getUniformLocation("material.alpha"), 1.0);
        gl.uniform1f(mShader.getUniformLocation("material.shininess"), 40.0);
        gl.uniform3fv(mShader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);

        renderObjectPicking(mShader, mMonitor, pickID);
        renderObjectPicking(mShader, mMonitor2, pickID);
        renderObjectPicking(mShader, mMonitor3, pickID);

        //Update Model Positions
        const sinAmplitude = 0.00025;
        const sinFreqency = 1.2;
        mMonitor.translate([0, Math.sin((time + 1) * sinFreqency) * sinAmplitude, 0]);
        mMonitor2.translate([0, Math.sin(time * sinFreqency) * sinAmplitude, 0]);
        mMonitor3.translate([0, Math.sin(time * sinFreqency) * sinAmplitude, 0]);

        //Monitor Text Rendering
        renderMonitorText();

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);

    //Event Listeners

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    gl.canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    gl.canvas.addEventListener('mousedown', (e) => {
        isLeftMouseDown = (e.button === 0);
    });

    gl.canvas.addEventListener('mouseup', () => {
        isLeftMouseDown = false;
    });

    divMonitorName.addEventListener('animationend', (event) => {
        showDescription = true;
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