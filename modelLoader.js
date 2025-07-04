export default class modelLoader
{
    async loadModel(path)
    {
        const response = await fetch (path);
        const text = await response.text();
        this.result = await this.parseModel(text);
    }

    getVertices() { return this.result[0]; }
    getUV() { return this.result[1]; }
    getNormals() { return this.result[2]; }
    getIndices() { return this.result[3]; }
    getTangents() { return this.result[4]; }

    async parseModel(data)
    {
        const lines = data.split("\n");
        
        var aCache = {} //reusable vertices
        var cVert = [], cUV = [], cNorm = []; //Raw data
        var fVert = [], fUV = [], fNorm = [], fIndex = [], tangents = []; //Final rendering data

        var faceParts;
        var fIndexCnt = 0;
        
        for (const line of lines)
        {
            const fixedLine = line.trim(); //removes surrounding whitespace
            if (!fixedLine || fixedLine.startsWith("#")) { continue; } //skip comments and empty lines

            switch(fixedLine.charAt(0))
            {
                case "v":
                    faceParts = fixedLine.split(" "); //creates an array of substrings divided by a single whitespace
                    faceParts.shift(); //removes first element

                    switch (fixedLine.charAt(1))
                    {
                        case " ": //Vertex position
                            cVert.push(parseFloat(faceParts[0]), parseFloat(faceParts[1]), parseFloat(faceParts[2])); //parseFloat converts string into floating-point representation
                            break;
                        case "t": //UV
                            cUV.push(parseFloat(faceParts[0]), parseFloat(faceParts[1]));
                            break;
                        case "n": //Normal
                            cNorm.push(parseFloat(faceParts[0]), parseFloat(faceParts[1]), parseFloat(faceParts[2]));
                            break;
                    } 
                    break;
                case "f":
                    faceParts = fixedLine.split(" "); //split face into three vertex parts with corresponding UV and normal indices
                    faceParts.shift();

                    for (let i = 0; i < faceParts.length; i++)
                    {
                        const vertexData = faceParts[i].split("/"); //<vertex index>/<texture_uv_index>/<normal_index>

                        if (faceParts[i] in aCache)
                        {
                            fIndex.push(aCache[faceParts[i]]);
                        }
                        else
                        {
                            let ind;
                            //Vertex
                            ind = (parseInt(vertexData[0]) - 1) * 3; //0-based indexing instead op 1-based
                            fVert.push(cVert[ind], cVert[ind + 1], cVert[ind + 2]);
                            //UV
                            ind = (parseInt(vertexData[1]) - 1) * 2;
                            fUV.push(cUV[ind], cUV[ind + 1]); //flip Y UV
                            //Normal
                            ind = (parseInt(vertexData[2]) - 1) * 3;
                            fNorm.push(cNorm[ind], cNorm[ind + 1], cNorm[ind + 2]);
                            
                            aCache[faceParts[i]] = fIndexCnt;
                            fIndex.push(fIndexCnt);
                            fIndexCnt++;
                        }
                    }
                    break;
            }
        }
        
        /*
        //Tangent Generation -- disabled for performance
        tangents = this.generateTangents(fVert, fUV, fIndex);
        */

        return [fVert, fUV, fNorm, fIndex, tangents];
    }

    generateTangents(vPositions, vTextures, vIndices)
    {
        const calcTangents = new Array(vPositions.length).fill(0);

        for (let i = 0; i < vIndices.length; i += 3)
        {
            const v0 = [vPositions[vIndices[i] * 3], vPositions[vIndices[i] * 3 + 1], vPositions[vIndices[i] * 3 + 2]];
            const v1 = [vPositions[vIndices[i + 1] * 3], vPositions[vIndices[i + 1] * 3 + 1], vPositions[vIndices[i + 1] * 3 + 2]];
            const v2 = [vPositions[vIndices[i + 2] * 3], vPositions[vIndices[i + 2] * 3 + 1], vPositions[vIndices[i + 2] * 3 + 2]];

            const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

            const v0Tex = [vTextures[vIndices[i] * 2], vTextures[vIndices[i] * 2 + 1]];
            const v1Tex = [vTextures[vIndices[i + 1] * 2], vTextures[vIndices[i + 1] * 2 + 1]];
            const v2Tex = [vTextures[vIndices[i + 2] * 2], vTextures[vIndices[i + 2] * 2 + 1]];

            const deltaU1 = v1Tex[0] - v0Tex[0];
            const deltaV1 = v1Tex[1] - v0Tex[1];
            const deltaU2 = v2Tex[0] - v0Tex[0];
            const deltaV2 = v2Tex[1] - v0Tex[1];

            const f = 1.0 / (deltaU1 * deltaV2 - deltaU2 * deltaV1);
            
            const tangents = [
                f * (-deltaU2 * edge1[0] + deltaU1 * edge2[0]),
                f * (-deltaU2 * edge1[1] + deltaU1 * edge2[1]),
                f * (-deltaU2 * edge1[2] + deltaU1 * edge2[2])
            ];

            calcTangents[vIndices[i] * 3] += tangents[0];
            calcTangents[vIndices[i] * 3 + 1] += tangents[1];
            calcTangents[vIndices[i] * 3 + 2] += tangents[2];

            calcTangents[vIndices[i + 1] * 3] += tangents[0];
            calcTangents[vIndices[i + 1] * 3 + 1] += tangents[1];
            calcTangents[vIndices[i + 1] * 3 + 2] += tangents[2];

            calcTangents[vIndices[i + 2] * 3] += tangents[0];
            calcTangents[vIndices[i + 2] * 3 + 1] += tangents[1];
            calcTangents[vIndices[i + 2] * 3 + 2] += tangents[2];
        }

        //Normalize Tangents
        for (let i = 0; i < calcTangents.length; i += 3)
        {
            const len = Math.hypot(calcTangents[i], calcTangents[i + 1], calcTangents[i + 2]);
            if (len > 0)
            {
                calcTangents[i] /= len;
                calcTangents[i + 1] /= len;
                calcTangents[i + 2] /= len;
            }
        }
        
        return calcTangents;
    }
}