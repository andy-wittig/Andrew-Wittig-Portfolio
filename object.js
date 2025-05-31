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
    
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) 
        {
            gl.generateMipmap(gl.TEXTURE_2D);
        } 
        else 
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = path;

    return texture;
}

function isPowerOf2(value)
{
    return (value & (value - 1 )) === 0;
}

export default class Object
{
    constructor(objPath)
    {
        this.objPath = objPath;
    }

    async Initialize()
    {
        this.modelMatrix = mat4.create();

        const mLoader = new objectLoader;
        await mLoader.loadObject(this.objPath);

        this.vertices = mLoader.getVertices();
        this.textureCoords = mLoader.getUV();
        this.indices = mLoader.getIndices();

        this.objectVAO = gl.createVertexArray();
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
        this.textureBuffer = gl.createBuffer();

        gl.bindVertexArray(this.objectVAO);

        // Vertex Position Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // Texture Coordinate Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        // Index Buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //flip textures
        this.texture = loadTexture("texture.png");
    }

    render(shader)
    {
        gl.bindVertexArray(this.objectVAO);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shader.getUniformLocation("textureDiffuse"), 0);

        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.bindVertexArray(null);
    }

    getModelMatrix()
    {
        return this.modelMatrix;
    }

    rotate(angle, axis)
    {
        mat4.rotate(this.modelMatrix, this.modelMatrix, angle, axis);
    }
}