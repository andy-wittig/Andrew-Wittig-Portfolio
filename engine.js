//Imports
import Shader from "./shader.js"
import Object from "./object.js"

//Get WebGL Context
const canvas = document.getElementById("main-canvas");
if (!canvas)
{
    console.log("Cannot get monitor canvas reference.");
}

const gl = canvas.getContext("webgl2");
if (!gl)
{
    console.log("This browser doesn't support WebGL 2.");
}
export default gl;

//HTML Integration
const divContainerElement = document.getElementById("container");
const divOverlayElement = document.getElementById("overlay");

const clipboardLeftButton = document.createElement("button");
clipboardLeftButton.className = "left-btn";
const clipboardRightButton = document.createElement("button");
clipboardRightButton.className = "right-btn";

const iconAnglesDown = document.createElement("i");
iconAnglesDown.className = "fa fa-angle-double-down";
const iconChevronLeft = document.createElement("i");
iconChevronLeft.className = "fa fa-chevron-left";
const iconChevronRight = document.createElement("i");
iconChevronRight.className = "fa fa-chevron-right";

const divMonitorElement = document.createElement("div");
const divMonitorName = document.createElement("div");
const divMonitorDesc = document.createElement("div");
divMonitorElement.className = "floating-div";

divContainerElement.append(iconAnglesDown);

clipboardLeftButton.append(iconChevronLeft);
clipboardRightButton.append(iconChevronRight);
divContainerElement.append(clipboardLeftButton);
divContainerElement.append(clipboardRightButton);

divMonitorElement.append(divMonitorName);
divMonitorElement.append(divMonitorDesc);
divOverlayElement.append(divMonitorElement);

//Shaders
const mShader = new Shader("Shaders/vertexPbrShaderSource.glsl", "Shaders/fragmentPbrShaderSource.glsl");
const mPickingShader = new Shader("Shaders/vertexPickingShaderSource.glsl", "Shaders/fragmentPickingShaderSource.glsl");

//Objects
const mMonitor = new Object("Models/retro_tv.obj", "Textures/tv_diffuse.png", "Textures/tv_normal.png", "Textures/tv_diffuse.png", "Textures/tv_diffuse.png", "Textures/tv_diffuse.png");
const mMonitor2 = new Object("Models/retro_tv.obj", "Textures/tv_diffuse.png", "Textures/tv_normal.png", null, null, null);
const mMonitor3 = new Object("Models/retro_tv.obj", "Textures/tv_diffuse.png", "Textures/tv_normal.png", null, null, null);
const mClipBoard = new Object("Models/clipboard.obj", "Textures/clipboard_diffuse.png", "Textures/clipboard_normal.png", "Textures/clipboard_metallic.png", "Textures/clipboard_roughness.png", null);
const mDesk = new Object("Models/desk.obj", "Textures/wood_diffuse.png", "Textures/wood_normal.png", null, "Textures/desk_roughness.png", null);
const mMug = new Object("Models/mug.obj", "Textures/mug_diffuse.png", "Textures/mug_normal.png", null, "Textures/mug_roughness.png", null);
const mPen = new Object("Models/pen.obj", "Textures/pen_diffuse.png", "Textures/pen_normal.png", null, null, null);

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

function easeInOut(t)
{
    if (t <= 0.5)
    {
        return 2.0 * t * t;
    }
    t -= 0.5;
    return 2.0 * t * (1.0 - t) + 0.5;
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
    await mClipBoard.Initialize();
    await mDesk.Initialize();
    await mMug.Initialize();
    await mPen.Initialize();

    mMonitor.setID(assignUniqueID());
    mMonitor2.setID(assignUniqueID());
    mMonitor3.setID(assignUniqueID());

    mMonitor.setName("<b>Who am I?</b>");
    mMonitor.setDescription("Driven to creating immersive experiences with stunning visuals.");
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

    let heightRatio = 1;

    //Monitor Camera
    let firstClick = false;

    const cameraStartRadius = 12;
    const cameraStartingPosition = [(cameraStartRadius) * Math.sin(degToRad(0)), 2.0, (cameraStartRadius) * Math.cos(degToRad(0))];
    const cameraStartingEye = [mMonitor.getPosition()[0], -2.0, mMonitor.getPosition()[1]];
    const cameraFov = 60;
    const cameraRadius = 10;
    const cameraView = [cameraStartingPosition, cameraStartingEye, new Float32Array([0, 1, 0])]; //position, eye, up vector

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();

    //Clipboard Camera
    const camera2Fov = 70;
    const cameraView2 = [[0, 1.6, 3.0], [0, .3, .8], [0, 1, 0]];

    function updateCamera(position, fov)
    {
        const referenceHeight = screen.height;
        const effectiveHeight = gl.canvas.height / 2;
        heightRatio = (effectiveHeight / referenceHeight);
        const fieldOfView = ((heightRatio * fov) * Math.PI) / 180;
        const zNear = 0.1;
        const zFar = 100.0;
        const aspect = gl.canvas.width / effectiveHeight;
        console.log(heightRatio);

        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.lookAt(viewMatrix, position[0], position[1], position[2]);
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
    
    function cameraAnimate(degree, position, radius)
    {
        let animDuration = 3;
        animProgress += deltaTime / animDuration;
        animProgress = Math.min(animProgress, 1);
        let easedProgress = easeInOut(animProgress);

        animStepRotation = animStartRotation + (degree - animStartRotation) * easedProgress;
        animStepRadius = animStartRadius + (radius - animStartRadius) * easedProgress;
        animStepPosition[0] = animStartPosition[0] + (position[0] - animStartPosition[0]) * easedProgress;
        animStepPosition[1] = animStartPosition[1] + (position[1] - animStartPosition[1]) * easedProgress;
        animStepPosition[2] = animStartPosition[2] + (position[2] - animStartPosition[2]) * easedProgress;

        cameraView[0][0] = animStepRadius * Math.sin(degToRad(animStepRotation));
        cameraView[0][1] = 2.0;
        cameraView[0][2] = animStepRadius * Math.cos(degToRad(animStepRotation));
        cameraView[1][0] = animStepPosition[0];
        cameraView[1][1] = animStepPosition[1];
        cameraView[1][2] = animStepPosition[2];

        if (animProgress == 1) { startCameraAnim = false; }
    }

    mMug.setPosition([1.8, .2, -.2]);
    mPen.setPosition([1.5, 0, .4]);
    mPen.rotate(degToRad(10), [0, 1, 0]);

    const clipboardStartingPos = [0, 1, 2];
    const clipboardSlideLeftPos = [-4, 1, 2];
    const clipboardSlideRightPos = [4, 1, 2];
    mClipBoard.setPosition(clipboardStartingPos);

    let clipboardAnimProgress = 0;
    let startClipboardAnim = false;
    let flipSlide = false;

    function clipboardAnimate(clipboardObject)
    {
        let startPos, endPos;

        if (!slideIn && !flipSlide)
        {
            startPos = clipboardStartingPos;
            endPos = clipboardSlideLeftPos;
        }
        else if (!slideIn && flipSlide)
        {
            startPos = clipboardSlideRightPos;
            endPos = clipboardStartingPos;
        }
        else if (slideIn && !flipSlide)
        {
            startPos = clipboardStartingPos;
            endPos = clipboardSlideRightPos;
        }
        else if (slideIn && flipSlide)
        {
            startPos = clipboardSlideLeftPos;
            endPos = clipboardStartingPos;
        }

        const animDuration = 3;
        clipboardAnimProgress += deltaTime / animDuration;
        clipboardAnimProgress = Math.min(clipboardAnimProgress, 1);
        let easedProgress = easeInOut(clipboardAnimProgress);

        const animX = startPos[0] + (endPos[0] - startPos[0]) * easedProgress;
        const animY = startPos[1] + (endPos[1] - startPos[1]) * easedProgress;
        const animZ = startPos[2] + (endPos[2] - startPos[2]) * easedProgress;

        clipboardObject.setPosition([animX, animY, animZ]);

        if (clipboardAnimProgress >= 0.5 && !flipSlide)
        {
            flipSlide = true;
        }

        if (clipboardAnimProgress == 1) 
        { 
            startClipboardAnim = false; 
        }
    }

    function clipboardLeftClick()
    {
        if (!startClipboardAnim) 
        {
            clipboardLeftButton.classList.remove("anim-fadeout-in");
            clipboardLeftButton.classList.add("anim-fadeout-in");
            clipboardAnimProgress = 0;
            startClipboardAnim = true;
            slideIn = false; //when false the clipboard slides out to the left
            flipSlide = false;
        }
    }
    function clipboardRightClick()
    {
        if (!startClipboardAnim) 
        {
            clipboardRightButton.classList.remove("anim-fadeout-in");
            clipboardRightButton.classList.add("anim-fadeout-in");
            clipboardAnimProgress = 0;
            startClipboardAnim = true;
            slideIn = true;
            flipSlide = false;
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
        gl.uniformMatrix3fv(shader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), object.getModelMatrix()))));
        object.render(shader);
        gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);
    }

    function getScreenPosFromObject(point, object)
    {
        var worldPosition = vec4.create();
        vec4.transformMat4(worldPosition, point, object.getModelMatrix());

        var viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

        var clipspace = vec4.create();
        vec4.transformMat4(clipspace, worldPosition, viewProjectionMatrix);

        clipspace[0] /= clipspace[3];
        clipspace[1] /= clipspace[3];

        var screenX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.clientWidth;
        var screenY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.clientHeight / 2; //divide by 2 since canvas styling height is 200%;

        return [screenX, screenY];
    }

    let showDescription = false;

    function renderMonitorText()
    {
        let pixelTextCoords = getScreenPosFromObject([0, 0.8, 0, 1], selectedObject);

        const name = selectedObject.getName();
        const desc = selectedObject.getDescription();
        divMonitorName.innerHTML = name;
        divMonitorDesc.innerHTML = desc;

        divMonitorElement.style.left = Math.floor(pixelTextCoords[0] - divMonitorElement.offsetWidth / 2) + "px";
        divMonitorElement.style.top = Math.floor(pixelTextCoords[1]) + "px";
        divMonitorElement.style.width = 28 * (1 / heightRatio) + "vh";
        divMonitorElement.style.height = 18 * (1 / heightRatio) + "vh";

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

            divMonitorName.classList.remove("anim-typewriter");
            divMonitorName.classList.add("anim-typewriter");
            divMonitorName.style.visibility = "visible";

            if (showDescription)
            {
                divMonitorDesc.classList.remove("anim-fadein");
                divMonitorDesc.classList.add("anim-fadein");
                divMonitorDesc.style.visibility = "visible";

                iconAnglesDown.classList.remove("anim-bounce-in");
                iconAnglesDown.classList.add("anim-bounce-in");
                iconAnglesDown.style.visibility = "visible";
            }
        }
        else
        {
            iconAnglesDown.style.visibility = "hidden";
            divMonitorName.style.visibility = "hidden";
            divMonitorDesc.style.visibility = "hidden";

            divMonitorName.classList.remove("anim-typewriter");
            divMonitorDesc.classList.remove("anim-fadein");
            iconAnglesDown.classList.remove("anim-bounce-in");

            showDescription = false;
        }
    }

    let mouseX = -1;
    let mouseY = -1;
    let prevTime = 0;
    let slideIn = false;
    
    function update(time) 
    {
        time *= 0.001; //convert to seconds
        deltaTime = time - prevTime;
        prevTime = time;

        //WebGL Render Settings
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.SCISSOR_TEST);
        gl.depthFunc(gl.LESS);

        resizeCanvasToDisplaySize(gl.canvas);
        setFrameBufferAttatchmentSize(gl.canvas.width, gl.canvas.height);
        
        if (startCameraAnim) { cameraAnimate(animRotationFinal, animPositionFinal, animRadiusFinal); }

        //Render Monitor Canvas
        updateCamera(cameraView, cameraFov);

        const halfHeight = gl.canvas.height / 2 | 0;
        gl.viewport(0, halfHeight, gl.canvas.width, gl.canvas.height - halfHeight);
        gl.scissor(0, halfHeight, gl.canvas.width, gl.canvas.height - halfHeight);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, mPickingBuffer);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        
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
        gl.uniform3fv(mShader.getUniformLocation("lightPositions[0]"), [0, 2.5, 0]);
        gl.uniform3fv(mShader.getUniformLocation("lightColors[0]"), [10, 10, 10]);
        gl.uniform3fv(mShader.getUniformLocation("lightPositions[1]"), cameraView[0]);
        gl.uniform3fv(mShader.getUniformLocation("lightColors[1]"), [20, 20, 20]);
        
        gl.uniform3fv(mShader.getUniformLocation("camPos"), cameraView[0]);
        gl.uniformMatrix4fv(mShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mShader.getUniformLocation("viewMatrix"), false, viewMatrix);

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

        //Render Clipboard Canvas
        gl.viewport(0, 0, gl.canvas.width, halfHeight);
        gl.scissor(0, 0, gl.canvas.width, halfHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        updateCamera(cameraView2, camera2Fov);

        mShader.enableShader();
        gl.uniform3fv(mShader.getUniformLocation("lightPositions[0]"), [0, 1.5, -.5]);
        gl.uniform3fv(mShader.getUniformLocation("lightColors[0]"), [10, 10, 10]);
        gl.uniform3fv(mShader.getUniformLocation("lightPositions[1]"), [0, 1.5, 3]);
        gl.uniform3fv(mShader.getUniformLocation("lightColors[1]"), [5, 5, 5]);
        gl.uniform3fv(mShader.getUniformLocation("camPos"), cameraView2[0]);
        gl.uniformMatrix4fv(mShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mShader.getUniformLocation("viewMatrix"), false, viewMatrix);

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mClipBoard.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mClipBoard.getModelMatrix()))));
        gl.uniform3fv(mShader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);
        mClipBoard.render(mShader);

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mDesk.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mDesk.getModelMatrix()))));
        mDesk.render(mShader);

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mMug.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mMug.getModelMatrix()))));
        mMug.render(mShader);

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mPen.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mPen.getModelMatrix()))));
        mPen.render(mShader);

        if (startClipboardAnim) 
        {
            clipboardAnimate(mClipBoard);
        }
        else
        {
            clipboardLeftButton.classList.remove("anim-fadeout-in");
            clipboardRightButton.classList.remove("anim-fadeout-in");
        }

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);

    //Canvas Resizing
    const canvasToDisplaySizeMap = new Map([[canvas, [300, 150]]]);

    function onResize(entries)
    {
        for (const entry of entries)
        {
            let width;
            let height;
            let dpr = window.devicePixelRatio;

            if (entry.devicePixelContentBoxSize)
            {
                width = entry.devicePixelContentBoxSize[0].inlineSize;
                height = entry.devicePixelContentBoxSize[0].blockSize;
                dpr = 1;
            } 
            else if (entry.contentBoxSize)
            {
                if (entry.contentBoxSize[0])
                {
                    width = entry.contentBoxSize[0].inlineSize;
                    height = entry.contentBoxSize[0].blockSize;
                } 
                else
                {
                    width = entry.contentBoxSize.inlineSize;
                    height = entry.contentBoxSize.blockSize;
                }
            } 
            else
            {
                width = entry.contentRect.width;
                height = entry.contentRect.height;
            }
            const displayWidth = Math.round(width * dpr);
            const displayHeight = Math.round(height * dpr);
            canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight]);
        }
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas, {box: "content-box"});

    function resizeCanvasToDisplaySize(canvas)
    {
        const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

        const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
        if (needResize)
        {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        return needResize;
    }

    //Event Listener
    let touchMoved = false;

    gl.canvas.addEventListener("touchstart", (event) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.changedTouches[0].clientX - rect.left;
        mouseY = event.changedTouches[0].clientY - rect.top;
        isLeftMouseDown = true;
    });
    gl.canvas.addEventListener("touchmove", (event) => {
        isLeftMouseDown = false;
    });
    gl.canvas.addEventListener("touchend", (event) => {
        isLeftMouseDown = false;
    });

    gl.canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    });

    gl.canvas.addEventListener('mousedown', (event) => {
        isLeftMouseDown = (event.button === 0);
    });

    gl.canvas.addEventListener('mouseup', () => {
        isLeftMouseDown = false;
    });

    divMonitorName.addEventListener('animationend', (event) => {
        showDescription = true;
    });

    clipboardLeftButton.addEventListener("click", clipboardLeftClick);
    clipboardRightButton.addEventListener("click", clipboardRightClick);
}

try
{
    runEngine();
}
catch (e)
{
    console.log(`Uncaught JavaScript exception: ${e}`);
}