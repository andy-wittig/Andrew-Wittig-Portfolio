 import gl from "./engine.js"
 import objectLoader from "./modelLoader.js"

async function loadTexture(path)
{
    if (path == null) { return 0; }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //flip textures for WebGL

    const texture = gl.createTexture();
    const image = new Image();
    
    return new Promise((resolve, reject) => {
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);

            resolve(texture);
        };

        image.onerror = (err) => {
            console.error(err);
            resolve(0);
        };

        image.src = path;
    });
}

export default class Model
{
    constructor(modelPath, albedoPath, normalPath, metallicPath, roughnessPath, aoPath)
    {
        this.modelPath = modelPath;
        this.albedoPath = albedoPath || null;
        this.normalPath = normalPath || null;
        this.metallicPath = metallicPath || null;
        this.roughnessPath = roughnessPath || null;
        this.aoPath = aoPath || null;
        this.id = [0, 0, 0, 1];
        this.description = "";
        this.name = "";
    }

    async Initialize()
    {
        try {
            this.modelMatrix = mat4.create();

            const mLoader = new objectLoader;
            await mLoader.loadModel(this.modelPath);

            this.vertexData = mLoader.getVertices();
            this.normalData = mLoader.getNormals();
            this.textureCoords = mLoader.getUV();
            this.tangents = mLoader.getTangents();
            this.indices = mLoader.getIndices();
            this.indexCount = this.indices.length;

            this.objectVAO = gl.createVertexArray();

            this.vertexBuffer = gl.createBuffer();
            this.normalBuffer = gl.createBuffer();
            this.textureBuffer = gl.createBuffer();
            this.tangentBuffer = gl.createBuffer();
            this.indexBuffer = gl.createBuffer();

            gl.bindVertexArray(this.objectVAO);

            // Vertex Position Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            //Normal Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

            //Texture Coordinate Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

            //Tangent Buffer
            /*
            gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangents), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
            */

            //Index Buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);

            gl.bindVertexArray(null);

            //Load Textures
            this.albedo = await loadTexture(this.albedoPath);
            this.normal = await loadTexture(this.normalPath);
            this.metallic = await loadTexture(this.metallicPath);
            this.roughness = await loadTexture(this.roughnessPath);
            this.ao = await loadTexture(this.aoPath);

            this.defaultWhite = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.defaultWhite);
            const whiteData = new Uint8Array([255, 255, 255, 255]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whiteData);

            this.defaultBlack = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.defaultBlack);
            const blackData = new Uint8Array([0, 0, 0, 255]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackData);
        }
        catch (err)
        {
            console.error(err);
            throw err;
        }
    }

    render(shader = null)
    {
        gl.bindVertexArray(this.objectVAO);
        
        if (shader)
        {
            gl.uniform1i(shader.getUniformLocation("albedoMap"), 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.albedo || this.defaultWhite);

            gl.uniform1i(shader.getUniformLocation("normalMap"), 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.normal || this.defaultWhite);

            gl.activeTexture(gl.TEXTURE2);
            gl.uniform1i(shader.getUniformLocation("metallicMap"), 2);
            gl.bindTexture(gl.TEXTURE_2D, this.metallic || this.defaultBlack);

            gl.uniform1i(shader.getUniformLocation("roughnessMap"), 3);
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.roughness || this.defaultBlack);

            gl.uniform1i(shader.getUniformLocation("aoMap"), 4);
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, this.ao || this.defaultWhite);
        } 

        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
    }

    setID(id)
    {
        this.id = id;
    }

    getID()
    {
        return this.id;
    }

    setDescription(text)
    {
        this.description = text;
    }

    getDescription()
    {
        return this.description;
    }

    setName(text)
    {
        this.name = text;
    }

    getName()
    {
        return this.name;
    }

    getModelMatrix()
    {
        return this.modelMatrix;
    }

    rotate(angle, axis)
    {
        mat4.rotate(this.modelMatrix, this.modelMatrix, angle, axis);
    }

    getRotation()
    {
        const rotationQuat = quat.create();
        mat4.getRotation(rotationQuat, this.modelMatrix);
        return rotationQuat;
    }

    setPosition(newPos)
    {
        mat4.identity(this.modelMatrix);
        this.translate(newPos);
    }

    getPosition()
    {
        const positionVec = vec3.create();
        mat4.getTranslation(positionVec, this.modelMatrix);
        return positionVec;
    }

    translate(transVec)
    {
        mat4.translate(this.modelMatrix, this.modelMatrix, transVec);
    }
}