export default class modelLoader
{
    async loadModel(path)
    {
        const response = await fetch (path);
        const text = await response.text();
        this.result = this.parseModel(text);
    }

    getVertices() { return this.result[0]; }
    getUV() { return this.result[1]; }
    getNormals() { return this.result[2]; }
    getIndices() { return this.result[3]; }
    getTangents() { return this.result[4]; }

    parseModel(data)
    {
        const lines = data.split("\n");
        
        let aCache = {} //reusable vertices
        let cVert = [], cUV = [], cNorm = []; //Raw data
        let fVert = [], fUV = [], fNorm = [], fIndex = [], tangents = []; //Final rendering data

        let fIndexCnt = 0;
        let faceParts = "";
        
        for (const line of lines)
        {
            const fixedLine = line.trim(); //removes surrounding whitespace
            if (!fixedLine || fixedLine.startsWith("#")) { continue; } //skip comments and empty lines

            const firstChar = fixedLine.charAt(0);
            const secondChar = fixedLine.charAt(1);

            switch(firstChar)
            {
                case "v":
                    faceParts = fixedLine.split(/\s+/).slice(1);

                    switch (secondChar)
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
                    faceParts = fixedLine.split(/\s+/).slice(1);

                    for (let i = 0; i < faceParts.length; i++)
                    {
                        const vertexData = faceParts[i].split("/"); //<vertex index>/<texture_uv_index>/<normal_index>

                        if (faceParts[i] in aCache)
                        {
                            fIndex.push(aCache[faceParts[i]]);
                        }
                        else
                        {
                            const vi = (parseInt(vertexData[0])  - 1) * 3; //0-based indexing instead of 1-based
                            const ti = (parseInt(vertexData[1])  - 1) * 2;
                            const ni = (parseInt(vertexData[2])  - 1) * 3;
                            
                            fVert.push(cVert[vi], cVert[vi + 1], cVert[vi + 2]);
                            fUV.push(cUV[ti], cUV[ti + 1]); //flip Y UV
                            fNorm.push(cNorm[ni], cNorm[ni + 1], cNorm[ni + 2]);
                            
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