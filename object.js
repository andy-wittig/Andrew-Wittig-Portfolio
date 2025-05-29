 import gl from "./engine.js";

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
    constructor()
    {
        this.modelMatrix = mat4.create();

        this.vertices = [
            //Front face
            -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
            //Back face
            -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
            //Top face
            -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
            //Bottom face
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            //Right face
            1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
            //Left face
            -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0
        ];
        this.indices = [
            0,
            1,
            2,
            0,
            2,
            3, //front
            4,
            5,
            6,
            4,
            6,
            7, //back
            8,
            9,
            10,
            8,
            10,
            11, //top
            12,
            13,
            14,
            12,
            14,
            15, //bottom
            16,
            17,
            18,
            16,
            18,
            19, //right
            20,
            21,
            22,
            20,
            22,
            23 //left
        ];
        this.textureCoords = [
            //Front
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            //Back
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            //Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            //Right
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            //Left
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ];

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