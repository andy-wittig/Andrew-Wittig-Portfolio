 import gl from "./engine.js"
 import objectLoader from "./objectLoader.js"

function loadTexture(path)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = path;

    return texture;
}

export default class Object
{
    constructor(objPath, diffusePath, specularPath, normalPath, emissionPath)
    {
        this.objPath = objPath;
        this.diffusePath = diffusePath || null;
        this.specularPath = specularPath || null;
        this.normalPath = normalPath || null;
        this.emissionPath = emissionPath || null;
        this.id = [0, 0, 0, 1];
    }

    async Initialize()
    {
        this.modelMatrix = mat4.create();

        const mLoader = new objectLoader;
        await mLoader.loadObject(this.objPath);

        this.vertices = mLoader.getVertices();
        this.normals = mLoader.getNormals();
        this.textureCoords = mLoader.getUV();
        this.tangents = mLoader.getTangents();
        this.indices = mLoader.getIndices();

        this.objectVAO = gl.createVertexArray();

        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.textureBuffer = gl.createBuffer();
        this.tangentBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        gl.bindVertexArray(this.objectVAO);

        // Vertex Position Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        //Normal Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        //Texture Coordinate Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        //Tangent Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangents), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);

        //Index Buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        //Load Textures
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //flip textures

        if (this.diffusePath !== null)
        {
            this.diffuseTexture = loadTexture(this.diffusePath);
        }
        if (this.specularPath !== null)
        {
            this.specularTexture = loadTexture(this.specularPath);
        }
        if (this.normalPath !== null)
        {
            this.normalTexture = loadTexture(this.normalPath);
        }
        if (this.emissionPath !== null)
        {
            this.emissionTexture = loadTexture(this.emissionPath);
        }
    }

    render(shader = null)
    {
        gl.bindVertexArray(this.objectVAO);
        
        if (this.diffusePath !== null && shader !== null)
        {
            gl.uniform1i(shader.getUniformLocation("material.textureDiffuse"), 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.diffuseTexture);  
        }
        if (this.specularPath !== null && shader !== null)
        {
            gl.uniform1i(shader.getUniformLocation("material.textureSpecular"), 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.specularTexture);  
        }
        if (this.normalPath !== null && shader !== null)
        {
            gl.uniform1i(shader.getUniformLocation("material.textureNormal"), 2);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);  
        }
        if (this.emissionPath !== null && shader !== null)
        {
            gl.uniform1i(shader.getUniformLocation("material.textureEmission"), 3);
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.emissionTexture);  
        }

        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

    setID(id)
    {
        this.id = id;
    }

    getID()
    {
        return this.id;
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