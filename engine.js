//---Dependencies---
import Shader from "./shader.js"
import Model from "./model.js"
import MathHelper from "./MathHelper.js"
import SiteContentHandler from "./SiteContentHandler.js";

//---WebGL Context---
const canvas = document.getElementById("main-canvas"); // Get canvas reference
if (!canvas)
{
    console.log("Cannot get the monitor canvas reference!");
}

const gl = canvas.getContext("webgl2");
if (!gl)
{
    console.log("This sites cannot be displayed as your browser doesn't support WebGL 2.");
}

gl.getExtension("EXT_color_buffer_float");

export default gl;

//---HTML Integration---
const siteContentHandler = new SiteContentHandler();

//---Shader Definitions---
const mShader = new Shader("Shaders/vertexPbrShaderSource.glsl", "Shaders/fragmentPbrShaderSource.glsl");
const mPickingShader = new Shader("Shaders/vertexPickingShaderSource.glsl", "Shaders/fragmentPickingShaderSource.glsl");
const mCubemapShader = new Shader("Shaders/vertexCubemapShaderSource.glsl", "Shaders/fragmentCubemapShaderSource.glsl");
const mConvolutionShader = new Shader("Shaders/vertexCubemapShaderSource.glsl", "Shaders/fragmentConvolutionShaderSource.glsl");
const mPrefilterShader = new Shader("Shaders/vertexCubemapShaderSource.glsl", "Shaders/fragmentPrefilterShaderSource.glsl");
const mBrdfShader = new Shader("Shaders/vertexBrdfShaderSource.glsl", "Shaders/fragmentBrdfShaderSource.glsl");
//const mSkyboxShader = new Shader("Shaders/vertexSkyboxShaderSource.glsl", "Shaders/fragmentSkyboxShaderSource.glsl");
const mNoiseShader = new Shader("Shaders/vertexBrdfShaderSource.glsl", "Shaders/fragmentNoiseShaderSource.glsl");

//---Model Definitions---
const mMonitor = new Model("Models/retro_tv.obj", "Textures/Monitor/diffuse.png", "Textures/Monitor/normal.png", "Textures/Monitor/metallic.png", "Textures/Monitor/roughness.png", "Textures/Monitor/ao.png");
const mMonitor2 = new Model("Models/retro_tv.obj", "Textures/Monitor/diffuse.png", "Textures/Monitor/normal.png", "Textures/Monitor/metallic.png", "Textures/Monitor/roughness.png", "Textures/Monitor/ao.png");
const mMonitor3 = new Model("Models/retro_tv.obj", "Textures/Monitor/diffuse.png", "Textures/Monitor/normal.png", "Textures/Monitor/metallic.png", "Textures/Monitor/roughness.png", "Textures/Monitor/ao.png");
const mClipBoard = new Model("Models/clipboard.obj", "Textures/clipboard_diffuse.png", "Textures/clipboard_normal.png", "Textures/clipboard_metallic.png", "Textures/clipboard_roughness.png", "Textures/clipboard_ao.png");
const mDesk = new Model("Models/desk.obj", "Textures/wood_diffuse.png", "Textures/wood_normal.png", null, "Textures/desk_roughness.png", null);
const mMug = new Model("Models/mug.obj", "Textures/Mug/diffuse.png", "Textures/Mug/normal.png", "Textures/Mug/metallic.png", "Textures/Mug/roughness.png", null);
const mPen = new Model("Models/pen.obj", "Textures/pen_diffuse.png", "Textures/pen_normal.png", null, null, null);
const mPhone = new Model("Models/phone.obj", "Textures/Phone/diffuse.png", "Textures/Phone/normal.png", null, "Textures/Phone/roughness.png", "Textures/Phone/ao.png");
const mPlant = new Model("Models/plant.obj", "Textures/Plant/diffuse.png", "Textures/Plant/normal.png", null, "Textures/Plant/roughness.png", null);
const mNote = new Model("Models/sticky note.obj", "Textures/Sticky Note/diffuse.png", "Textures/Sticky Note/normal.png", null, "Textures/Sticky Note/roughness.png", "Textures/Sticky Note/ao.png");
const mCube = new Model("Models/cube.obj");
const mQuad = new Model("Models/quad.obj");

//--------------------Picking Frambuffer--------------------
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

const mPickingBuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, mPickingBuffer);

gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
//--------------------End Picking Buffer--------------------

//--------------------PBR Framebuffers--------------------
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.TEXTURE_CUBE_MAP_SEAMLESS);
gl.depthFunc(gl.LEQUAL);

var captureFBO = gl.createFramebuffer();
var captureRBO = gl.createRenderbuffer();

gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

//Load HDR environment map
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //flip textures

const hdrTexture = gl.createTexture();

function loadHDRImage(url)
{
    return new Promise((resolve, reject) => {
        const hdrImage = new HDRImage();
        hdrImage.src = url;
        hdrImage.onload = () => resolve(hdrImage);
        hdrImage.onerror = reject;
    });
}

const hdrImage = await loadHDRImage("HDR/lounge.hdr");
gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, hdrImage.width, hdrImage.height, 0, gl.RGB, gl.FLOAT, hdrImage.dataFloat);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

//Setup Cubemap
const envCubemap = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
for (let i = 0; i < 6; i++)
{
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 512, 512, 0, gl.RGBA, gl.FLOAT, null);
}
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

//Convert HDR equirectangular environment map to cubemap
const captureProjection = mat4.perspective(mat4.create(), MathHelper.DegToRad(90), 1.0, 0.1, 10.0);
const captureViews = [
    mat4.lookAt(mat4.create(), [0, 0, 0], [1, 0, 0], [0, -1, 0]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [-1, 0, 0], [0, -1, 0]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 0, 1]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, -1, 0], [0, 0, -1]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, 1], [0, -1, 0]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, -1, 0])
];

await Promise.all([
    mCube.Initialize(),
    mQuad.Initialize(),
    mCubemapShader.Initialize(),
    mConvolutionShader.Initialize(),
    mPrefilterShader.Initialize(),
    mBrdfShader.Initialize()
]);

mCubemapShader.enableShader();
gl.uniform1i(mCubemapShader.getUniformLocation("equirectangularMap"), 0);
gl.uniformMatrix4fv(mCubemapShader.getUniformLocation("projectionMatrix"), false, captureProjection);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, hdrTexture);

gl.viewport(0, 0, 512, 512);
gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
for (let i = 0; i < 6; i++)
{
    gl.uniformMatrix4fv(mCubemapShader.getUniformLocation("viewMatrix"), false, captureViews[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mCube.render();
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
mCubemapShader.destroyShader()

//Irradiance Map
const irradianceMap = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);

for (let i = 0; i < 6; i++)
{
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 32, 32, 0, gl.RGBA, gl.FLOAT, null);
}
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 32, 32);

mConvolutionShader.enableShader();
gl.uniform1i(mConvolutionShader.getUniformLocation("environmentMap"), 0);
gl.uniformMatrix4fv(mConvolutionShader.getUniformLocation("projectionMatrix"), false, captureProjection);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

gl.viewport(0, 0, 32, 32);
gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
for (let i = 0; i < 6; i++)
{
    gl.uniformMatrix4fv(mConvolutionShader.getUniformLocation("viewMatrix"), false, captureViews[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, irradianceMap, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mCube.render();
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
mConvolutionShader.destroyShader()

//Pre-filter Cubemap
const prefilterMap = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilterMap);

for (let i = 0; i < 6; i++)
{
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 128, 128, 0, gl.RGBA, gl.FLOAT, null);
}

gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

mPrefilterShader.enableShader();
gl.uniform1i(mPrefilterShader.getUniformLocation("environmentMap"), 0);
gl.uniformMatrix4fv(mPrefilterShader.getUniformLocation("projectionMatrix"), false, captureProjection);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
const maxMipLevels = 5;
for (let mip = 0; mip < maxMipLevels; mip++)
{
    const mipWidth = 128 * Math.pow(0.5, mip);
    const mipHeight = 128 * Math.pow(0.5, mip);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mipWidth, mipHeight);
    gl.viewport(0, 0, mipWidth, mipHeight);

    const roughness = mip / (maxMipLevels - 1);
    gl.uniform1f(mPrefilterShader.getUniformLocation("roughness"), roughness);
    for (let i = 0; i < 6; i++)
    {
        gl.uniformMatrix4fv(mPrefilterShader.getUniformLocation("viewMatrix"), false, captureViews[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, prefilterMap, mip);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mCube.render();
    }
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
mPrefilterShader.destroyShader()

//Generate 2D LUT
const brdfLUTTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);

gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, 512, 512, 0, gl.RG, gl.FLOAT, null);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, brdfLUTTexture, 0);

gl.viewport(0, 0, 512, 512);
mBrdfShader.enableShader();
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
mQuad.render();
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
mBrdfShader.destroyShader()
//--------------------End PBR Framebuffers--------------------

//--------------------Object ID--------------------
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
//--------------------End Object ID--------------------

//--------------------Rendering Initialization--------------------
await Promise.all([ //Run in parallel
    await mPickingShader.Initialize(),
    await mShader.Initialize(),
    //await mSkyboxShader.Initialize(), //--Enable when drawing the skybox
    await mNoiseShader.Initialize(),
    await mMonitor.Initialize(),
    await mMonitor2.Initialize(),
    await mMonitor3.Initialize(),
    await mClipBoard.Initialize(),
    await mDesk.Initialize(),
    await mMug.Initialize(),
    await mPen.Initialize(),
    await mPhone.Initialize(),
    await mPlant.Initialize(),
    await mNote.Initialize()
]);

mMonitor.setID(assignUniqueID());
mMonitor2.setID(assignUniqueID());
mMonitor3.setID(assignUniqueID());

mMonitor.setName("<b>About Me</b>");
mMonitor.setDescription("I spend my time creating immersive experiences within websites, programs, and games.");

mMonitor2.setName("<b>Projects</b>");
mMonitor2.setDescription("Scroll down to read more about the projects I've been developing!");

mMonitor3.setName("<b>Skills</b>");
mMonitor3.setDescription(`
<ul>
<li>C++, C#, Python</li>
<li>Javascript, HTML, CSS</li>
<li>WebGL, OpenGL</li>
</ul> 
`);

//Setup Monitor Scene 1 Transformations
mMonitor.rotate((0 * Math.PI) / 180, [0, 1, 0]);
mMonitor2.rotate((45 * Math.PI) / 180, [0, 1, 0]);
mMonitor3.rotate((-45 * Math.PI) / 180, [0, 1, 0]);

const objectPositionRadius = 5;
mMonitor.translate([0, 0, objectPositionRadius]);
mMonitor2.translate([0, 0, objectPositionRadius]);
mMonitor3.translate([0, 0, objectPositionRadius]);

///Setup Clipboard Scene 2 Trasformations
mMug.setPosition([2.2, 0, 0.5]);
mMug.rotate(MathHelper.DegToRad(-45), [0, 1, 0]);
mPen.setPosition([1.5, 0, 1]);
mPen.rotate(MathHelper.DegToRad(10), [0, 1, 0]);
mPhone.setPosition([-1.8, 0, 0.8]);
mPhone.rotate(MathHelper.DegToRad(45), [0, 1, 0]);
mPlant.setPosition([2, 0, -.8]);

const clipboardStartingPos = [0, 1.02, 2.05];
mClipBoard.setPosition(clipboardStartingPos);

mShader.enableShader();
gl.uniform1i(mShader.getUniformLocation("albedoMap"), 0);
gl.uniform1i(mShader.getUniformLocation("normalMap"), 1);
gl.uniform1i(mShader.getUniformLocation("metallicMap"), 2);
gl.uniform1i(mShader.getUniformLocation("roughnessMap"), 3);
gl.uniform1i(mShader.getUniformLocation("aoMap"), 4);
gl.uniform1i(mShader.getUniformLocation("irradianceMap"), 5);
gl.uniform1i(mShader.getUniformLocation("prefilterMap"), 6);
gl.uniform1i(mShader.getUniformLocation("brdfLUT"), 7);
//--------------------End Rendering Initialization--------------------

let deltaTime = 0;
async function InitEngine()
{
    siteContentHandler.InitHTMLElements();

    //Scene 1 Camera
    let firstClick = false;
    const cameraStartRadius = 12;
    const cameraStartingPosition = [(cameraStartRadius) * Math.sin(MathHelper.DegToRad(0)), 1.5, (cameraStartRadius) * Math.cos(MathHelper.DegToRad(0))];
    const cameraStartingEye = [mMonitor.getPosition()[0], -2.0, mMonitor.getPosition()[1]];
    const cameraFov = 60;
    const cameraRadius = 10;
    const cameraView = [cameraStartingPosition, cameraStartingEye, new Float32Array([0, 1, 0])]; //position, eye, up vector
    
    //Scene 2 Camera
    const camera2Fov = 60;
    const cameraView2 = [[0, 1.6, 3.1], [0, .35, .8], [0, 1, 0]];
    
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    var selectedObject = mMonitor;

    //--------------------Monitor Animation--------------------
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
        let easedProgress = MathHelper.EaseInThenOut(animProgress);

        animStepRotation = animStartRotation + (degree - animStartRotation) * easedProgress;
        animStepRadius = animStartRadius + (radius - animStartRadius) * easedProgress;
        animStepPosition[0] = animStartPosition[0] + (position[0] - animStartPosition[0]) * easedProgress;
        animStepPosition[1] = animStartPosition[1] + (position[1] - animStartPosition[1]) * easedProgress;
        animStepPosition[2] = animStartPosition[2] + (position[2] - animStartPosition[2]) * easedProgress;

        cameraView[0][0] = animStepRadius * Math.sin(MathHelper.DegToRad(animStepRotation));
        cameraView[0][1] = 1.5;
        cameraView[0][2] = animStepRadius * Math.cos(MathHelper.DegToRad(animStepRotation));
        cameraView[1][0] = animStepPosition[0];
        cameraView[1][1] = animStepPosition[1];
        cameraView[1][2] = animStepPosition[2];

        if (animProgress == 1) { startCameraAnim = false; }
    }
    //--------------------End Monitor Animation--------------------

    //--------------------Clipboard Animation--------------------
    const clipboardSlideLeftPos = [-4, 1.02, 2.05];
    const clipboardSlideRightPos = [4, 1.02, 2.05];
    let pageCount = 0;
    let clipboardAnimProgress = 0;
    let startClipboardAnim = false;
    let flipSlide = false;
    let slideIn = false;

    function clipboardAnimate(clipboardObject)
    {
        let startPos, endPos;
        let pageIt = 0;

        if (!slideIn && !flipSlide) //Left button clicked
        {
            startPos = clipboardStartingPos;
            endPos = clipboardSlideLeftPos;
            pageIt = -1;
        }
        else if (!slideIn && flipSlide)
        {
            startPos = clipboardSlideRightPos;
            endPos = clipboardStartingPos;
        }
        else if (slideIn && !flipSlide) //Right button
        {
            startPos = clipboardStartingPos;
            endPos = clipboardSlideRightPos;
            pageIt = 1;
        }
        else if (slideIn && flipSlide)
        {
            startPos = clipboardSlideLeftPos;
            endPos = clipboardStartingPos;
        }

        const animDuration = 2.6;
        clipboardAnimProgress += deltaTime / animDuration;
        clipboardAnimProgress = Math.min(clipboardAnimProgress, 1);
        let easedProgress = MathHelper.EaseInThenOut(clipboardAnimProgress);

        const animX = startPos[0] + (endPos[0] - startPos[0]) * easedProgress;
        const animY = startPos[1] + (endPos[1] - startPos[1]) * easedProgress;
        const animZ = startPos[2] + (endPos[2] - startPos[2]) * easedProgress;

        clipboardObject.setPosition([animX, animY, animZ]);

        if (clipboardAnimProgress >= 0.5 && !flipSlide)
        {
            flipSlide = true;
            pageCount += pageIt;
            updatePage();
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
            siteContentHandler.clipboardLeftButton.classList.remove("anim-fadeout-in");
            siteContentHandler.clipboardLeftButton.classList.add("anim-fadeout-in");
            siteContentHandler.clipboardRightButton.classList.remove("anim-fadeout-in");
            siteContentHandler.clipboardRightButton.classList.add("anim-fadeout-in");
            siteContentHandler.divClipboardContainer.classList.remove("anim-fadeout-in");
            siteContentHandler.divClipboardContainer.classList.add("anim-fadeout-in");

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
            siteContentHandler.clipboardLeftButton.classList.remove("anim-fadeout-in");
            siteContentHandler.clipboardLeftButton.classList.add("anim-fadeout-in");
            siteContentHandler.clipboardRightButton.classList.remove("anim-fadeout-in");
            siteContentHandler.clipboardRightButton.classList.add("anim-fadeout-in");
            siteContentHandler.divClipboardContainer.classList.remove("anim-fadeout-in");
            siteContentHandler.divClipboardContainer.classList.add("anim-fadeout-in");

            clipboardAnimProgress = 0;
            startClipboardAnim = true;
            slideIn = true;
            flipSlide = false;
        }
    }
    //--------------------End Clipboard Animation--------------------

    //--------------------Object Picking--------------------
    function getPickingID()
    {
        const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
        const data = new Uint8Array(4);

        gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
        const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24) >>> 0;
        return id;
    }

    function renderObjectPicking(shader, Model, id)
    {
        var objectID = Model.getID();
        var encodedObjectID = objectID[0] * 255 + (objectID[1] * 255 << 8) + (objectID[2] * 255 << 16) + (objectID[3] * 255 << 24) >>> 0;
        
        if (id == encodedObjectID) 
        {
            if (isLeftMouseDown && !startCameraAnim && (selectedObject !== Model || !firstClick))
            {
                //get y objects rotation and position
                const rotationQuat = Model.getRotation();
                const angleY = Math.atan2(2 * (rotationQuat[3] * rotationQuat[1] + rotationQuat[0] * rotationQuat[2]),
                                        1 - 2 * (rotationQuat[1] * rotationQuat[1] + rotationQuat[2] * rotationQuat[2]));
                animRotationFinal = Math.round(MathHelper.RadToDeg(angleY));
                animPositionFinal = Model.getPosition();
                animRadiusFinal = cameraRadius;
                selectedObject = Model;
                pageCount = 0; //Reset page count
                updatePage();

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
        gl.uniformMatrix4fv(shader.getUniformLocation("modelMatrix"), false, Model.getModelMatrix());
        gl.uniformMatrix3fv(shader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), Model.getModelMatrix()))));
        Model.render(shader);
        gl.uniform3fv(shader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);
    }
    //--------------------End Object Picking--------------------

    function getScreenPosFromObject(point, targetModel, useTopViewport = true)
    {
        var worldPosition = vec4.create();
        vec4.transformMat4(worldPosition, point, targetModel.getModelMatrix());

        var viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

        var clipspace = vec4.create();
        vec4.transformMat4(clipspace, worldPosition, viewProjectionMatrix);

        clipspace[0] /= clipspace[3];
        clipspace[1] /= clipspace[3];

        var screenX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.clientWidth;

        if (useTopViewport) //Top Viewport
            var screenY = (clipspace[1] * -0.5 + 0.5) * (gl.canvas.clientHeight / 2);
        else //Bottom Viewport
            var screenY = ((clipspace[1] * -0.5 + 0.5) * (gl.canvas.clientHeight / 2)) + (gl.canvas.clientHeight / 2);

        return [screenX, screenY];
    }

    let showDescription = false;

    function renderMonitorContent()
    {
        let topLeft = getScreenPosFromObject([-0.7, 0.7, 1, 1], selectedObject);
        let bottomRight = getScreenPosFromObject([0.7, -0.2, 1, 1], selectedObject);

        const name = selectedObject.getName();
        const desc = selectedObject.getDescription();
        siteContentHandler.divMonitorName.innerHTML = name;
        siteContentHandler.divMonitorDesc.innerHTML = desc;

        //Resize monitor text box
        siteContentHandler.divMonitor.style.left = Math.floor(topLeft[0]) + "px";
        siteContentHandler.divMonitor.style.top = Math.floor(topLeft[1]) + "px";
        siteContentHandler.divMonitor.style.width = Math.floor(bottomRight[0] - topLeft[0]) + "px";
        siteContentHandler.divMonitor.style.height = Math.floor(bottomRight[1] - topLeft[1]) + "px";

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

            siteContentHandler.divMonitorName.classList.remove("anim-typewriter");
            siteContentHandler.divMonitorName.classList.add("anim-typewriter");
            siteContentHandler.divMonitorName.style.visibility = "visible";

            if (showDescription)
            {
                siteContentHandler.divMonitorDesc.classList.remove("anim-fadein");
                siteContentHandler.divMonitorDesc.classList.add("anim-fadein");
                siteContentHandler.divMonitorDesc.style.visibility = "visible";

                siteContentHandler.iconAnglesDown.classList.remove("anim-bounce-in");
                siteContentHandler.iconAnglesDown.classList.add("anim-bounce-in");
                siteContentHandler.iconAnglesDown.style.visibility = "visible";
            }
        }
        else
        {
            siteContentHandler.iconAnglesDown.style.visibility = "hidden";
            siteContentHandler.divMonitorName.style.visibility = "hidden";
            siteContentHandler.divMonitorDesc.style.visibility = "hidden";

            siteContentHandler.divMonitorName.classList.remove("anim-typewriter");
            siteContentHandler.divMonitorDesc.classList.remove("anim-fadein");
            siteContentHandler.iconAnglesDown.classList.remove("anim-bounce-in");

            showDescription = false;
        }
    }

    //--------------------Clipboard Content--------------------
    const aboutPageID = mMonitor.getID()
    const projectPageID = mMonitor2.getID()
    const skillPageID = mMonitor3.getID()

    const clipboardPages = {
        [aboutPageID]:["Clipboard Content/About Pages/about-page1.html", "Clipboard Content/About Pages/about-page2.html"],
        [projectPageID]:["Clipboard Content/Project Pages/project-page1.html", "Clipboard Content/Project Pages/project-page2.html",
                        "Clipboard Content/Project Pages/project-page3.html", "Clipboard Content/Project Pages/project-page4.html"],
        [skillPageID]:["Clipboard Content/Skill Pages/skill-page1.html"]
    };
    
    function updatePage()
    {
        siteContentHandler.divPageIndicator.replaceChildren();
        let indicators = siteContentHandler.divPageIndicator.children;
        let currentPageID = selectedObject.getID().toString();
        let pageLength = clipboardPages[currentPageID].length;

        pageCount = Math.max(0, Math.min(pageCount, pageLength - 1)); //clamp pages

        if (pageCount == 0) { siteContentHandler.clipboardLeftButton.disabled = true; }
        else { siteContentHandler.clipboardLeftButton.disabled = false; }
        if (pageCount == pageLength - 1) { siteContentHandler.clipboardRightButton.disabled = true; }
        else { siteContentHandler.clipboardRightButton.disabled = false; }

        for (let i = 0; i < pageLength; i++) //Set page indicators
        {
            const indicatorBullet = document.createElement("span");
            siteContentHandler.divPageIndicator.append(indicatorBullet);
            indicatorBullet.innerHTML = "&#9702;";
        }
        indicators[pageCount].innerHTML = "&#8226;";

        //Fetch HTML page content
        fetch (clipboardPages[currentPageID][pageCount])
            .then (response => response.text())
            .then (htmlContent => {
                siteContentHandler.divClipboard.innerHTML = htmlContent;
            })
            .catch (err => {
                console.error("Could not fetch the HTML file: ", err);
            });
    }
    updatePage(); //update at start

    function renderClipboardContent()
    {
        let topLeft = getScreenPosFromObject([-.32, .32, -.15, 1], mClipBoard, false);
        let bottomRight = getScreenPosFromObject([.32, -.45, .28, 1], mClipBoard, false);
        let leftButtonPos = getScreenPosFromObject([-0.4, 0, 0, 1], mClipBoard, false);
        let rightButtonPos = getScreenPosFromObject([0.4, 0, 0, 1], mClipBoard, false);

        //Clipboard Element Positioning
        siteContentHandler.divClipboard.style.left = Math.floor(topLeft[0]) + "px"; 
        siteContentHandler.divClipboard.style.top = Math.floor(topLeft[1]) + "px";
        siteContentHandler.divClipboard.style.width = Math.floor(bottomRight[0] - topLeft[0]) + "px";
        siteContentHandler.divClipboard.style.height = Math.floor(bottomRight[1] - topLeft[1]) + "px";

        siteContentHandler.clipboardLeftButton.style.left = (Math.floor(leftButtonPos[0] - siteContentHandler.clipboardLeftButton.offsetWidth / 2)) + "px";
        siteContentHandler.clipboardLeftButton.style.top = (Math.floor(leftButtonPos[1] - siteContentHandler.clipboardLeftButton.offsetHeight / 2)) + "px";
        siteContentHandler.clipboardRightButton.style.left = (Math.floor(rightButtonPos[0] - siteContentHandler.clipboardLeftButton.offsetWidth / 2)) + "px";
        siteContentHandler.clipboardRightButton.style.top = (Math.floor(rightButtonPos[1] - siteContentHandler.clipboardLeftButton.offsetHeight / 2)) + "px";
    }

    function renderNoteContent()
    {
        let notePos = getScreenPosFromObject([-.1, 0, 0, 1], mNote, false);

        siteContentHandler.divNote.innerHTML = `
        <strong>
        Contact Me!
        <br>
        (775) 409-9505
        </strong>
        `;

        siteContentHandler.divNote.style.left = Math.floor(notePos[0]) + "px"; 
        siteContentHandler.divNote.style.top = Math.floor(notePos[1]) + "px";
    }
    //--------------------End Clipboard--------------------

    function updateCamera(view, fov)
    {
        let effectiveHeight = gl.canvas.clientHeight / 2;
        let fieldOfView = MathHelper.DegToRad(fov);
        let zNear = 0.1;
        let zFar = 100.0;
        let aspect = gl.canvas.clientWidth / effectiveHeight;

        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.lookAt(viewMatrix, view[0], view[1], view[2]);
    }

    let mouseX = -1;
    let mouseY = -1;
    let prevTime = 0;
    
    function update(time) //Called every frame and renders the scene
    {
        time *= 0.001; //converts to seconds
        deltaTime = time - prevTime;
        prevTime = time;

        //WebGL Render Settings
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.SCISSOR_TEST);
        gl.depthFunc(gl.LESS);

        //Canvas resize
        resizeCanvasToDisplaySize();
        setFrameBufferAttatchmentSize(gl.canvas.width, gl.canvas.height);

        //Scene 1 Viewport
        const halfHeight = gl.canvas.clientHeight / 2 | 0;
        gl.viewport(0, halfHeight, gl.canvas.clientWidth, gl.canvas.clientHeight - halfHeight);
        gl.scissor(0, halfHeight, gl.canvas.clientWidth, gl.canvas.clientHeight - halfHeight);

        //Update Camera and Animate
        if (startCameraAnim) { cameraAnimate(animRotationFinal, animPositionFinal, animRadiusFinal); }
        updateCamera(cameraView, cameraFov);
        
        //--------------------Render Picking--------------------
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

        let pickID = getPickingID();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //--------------------End Picking--------------------

        //--------------------Render Scene 1--------------------
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //Render Noise Background
        gl.disable(gl.DEPTH_TEST);
        mNoiseShader.enableShader();
        gl.uniform1f(mNoiseShader.getUniformLocation("time"), time);
        mQuad.render();
        gl.enable(gl.DEPTH_TEST);
        
        mShader.enableShader();
        /*
        //Lighting Uniforms -- Enabling will reduce efficiency
        gl.uniform3fv(mShader.getUniformLocation("lightPositions[0]"), [0, 2.5, 0]);
        gl.uniform3fv(mShader.getUniformLocation("lightColors[0]"), [5, 5, 5]);
        gl.uniform3fv(mShader.getUniformLocation("lightPositions[1]"), cameraView[0]);
        gl.uniform3fv(mShader.getUniformLocation("lightColors[1]"), [5, 5, 5]);
        */

        //Camera Uniforms
        gl.uniform3fv(mShader.getUniformLocation("camPos"), cameraView[0]);
        gl.uniformMatrix4fv(mShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mShader.getUniformLocation("viewMatrix"), false, viewMatrix);

        //Binding pre-computed IBL data
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilterMap);
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);

        //Render Scene Objects
        gl.uniform3fv(mShader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);
        renderObjectPicking(mShader, mMonitor, pickID);
        renderObjectPicking(mShader, mMonitor2, pickID);
        renderObjectPicking(mShader, mMonitor3, pickID);

        //Monitor Text Rendering
        renderMonitorContent();

        //Update Model Positions
        const sinAmplitude = 0.00025;
        const sinFreqency = 1.4;
        mMonitor.translate([0, Math.sin(time * sinFreqency) * sinAmplitude, 0]);
        mMonitor2.translate([0, Math.sin((time + 1) * sinFreqency) * sinAmplitude, 0]);
        mMonitor3.translate([0, Math.sin((time + 2) * sinFreqency) * sinAmplitude, 0]);
        //--------------------End Scene 1--------------------

        //--------------------Render Scene 2--------------------
        //Scene 2 Viewport
        gl.viewport(0, 0, gl.canvas.clientWidth, halfHeight);
        gl.scissor(0, 0, gl.canvas.clientWidth, halfHeight);

        updateCamera(cameraView2, camera2Fov);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mShader.enableShader();
        /*
        //Lighting Uniforms -- Enabling will reduce efficiency
        //gl.uniform3fv(mShader.getUniformLocation("lightPositions[0]"), [0, 1.5, -.5]);
        //gl.uniform3fv(mShader.getUniformLocation("lightColors[0]"), [10, 10, 10]);
        //gl.uniform3fv(mShader.getUniformLocation("lightPositions[1]"), [0, 1.5, 3]);
        //gl.uniform3fv(mShader.getUniformLocation("lightColors[1]"), [5, 5, 5]);
        */

        //Camera Uniforms
        gl.uniform3fv(mShader.getUniformLocation("camPos"), cameraView2[0]);
        gl.uniformMatrix4fv(mShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mShader.getUniformLocation("viewMatrix"), false, viewMatrix);

        //Scene Objects Rendering
        gl.uniform3fv(mShader.getUniformLocation("colorMultiplier"), [1.0, 1.0, 1.0]);

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mClipBoard.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mClipBoard.getModelMatrix()))));
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

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mPhone.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mPhone.getModelMatrix()))));
        mPhone.render(mShader);

        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mPlant.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mPlant.getModelMatrix()))));
        mPlant.render(mShader);

        let newPos = vec3.create();
        vec3.add(newPos, mClipBoard.getPosition(), [-.28, .485, -.26]);
        mNote.setPosition(newPos);
        gl.uniformMatrix4fv(mShader.getUniformLocation("modelMatrix"), false, mNote.getModelMatrix());
        gl.uniformMatrix3fv(mShader.getUniformLocation("normalMatrix"), false, mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), mNote.getModelMatrix()))));
        mNote.render(mShader);

        //HTML Text Rendering
        renderClipboardContent();
        renderNoteContent();

        //Animations
        if (startClipboardAnim)
        {
            clipboardAnimate(mClipBoard);
        }
        else
        {
            siteContentHandler.clipboardLeftButton.classList.remove("anim-fadeout-in");
            siteContentHandler.clipboardRightButton.classList.remove("anim-fadeout-in");
            siteContentHandler.divClipboardContainer.classList.remove("anim-fadeout-in");
        }
        //--------------------End Scene 2--------------------

        /* 
        //Skybox for testing purposes -- make sure to re-enable shader initialization
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);

        mSkyboxShader.enableShader();
        gl.uniformMatrix4fv(mSkyboxShader.getUniformLocation("projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(mSkyboxShader.getUniformLocation("viewMatrix"), false, viewMatrix);
        gl.uniform1i(mSkyboxShader.getUniformLocation("environmentMap"), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
        mCube.render();
        */
        //Display LUT
        //mBrdfShader.enableShader();
        //mQuad.render();

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);

    //--------------------Canvas Resizing--------------------
    function resizeCanvasToDisplaySize() 
    {
        var width = gl.canvas.clientWidth;
        var height = gl.canvas.clientHeight;

        if (gl.canvas.width != width ||
            gl.canvas.height != height) 
        {
            gl.canvas.width = width;
            gl.canvas.height = height;
        }
    }
    //--------------------End Canvas Resizing--------------------

    //--------------------Event Listeners--------------------
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

    siteContentHandler.divMonitorName.addEventListener('animationend', (event) => {
        showDescription = true;
    });

    siteContentHandler.clipboardLeftButton.addEventListener("click", clipboardLeftClick);
    siteContentHandler.clipboardRightButton.addEventListener("click", clipboardRightClick);

    document.addEventListener("scroll", () => {
        let currentScrollPos = window.scrollY;
        let maxScrollY = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        let scrolledPercent = currentScrollPos / maxScrollY;
        const divOverlayFade = document.getElementById("overlay-fade");
        const fadeMultiplier = 1.5;
        divOverlayFade.style.backgroundColor = `rgb(19, 19, 20, ${scrolledPercent * fadeMultiplier})`;
        siteContentHandler.iconAnglesDown.style.opacity = 1 - scrolledPercent * fadeMultiplier;
        //console.log(scrolledPercent); debug
    });
}
//--------------------End Event Listeners--------------------

try
{
    InitEngine();
}
catch (e)
{
    console.log(`Uncaught JavaScript exception: ${e}`);
}