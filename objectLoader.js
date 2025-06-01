export default class objectLoader
{
    async loadObject(path)
    {
        const response = await fetch (path);
        const text = await response.text();

        this.result = await this.parseObj(text);
        //Testing
        //console.log(this.result[0] + "\n");
        //console.log(this.result[1] + "\n");
        //console.log(this.result[2] + "\n");
        console.log(this.result[3] + "\n");
    }

    getVertices() { return this.result[0]; }
    getUV() { return this.result[1]; }
    getNormals() { return this.result[2]; }
    getIndices() { return this.result[3]; }

    async parseObj(data)
    {
        const lines = data.split("\n");
        
        var aCache = {} //reusable vertices
        var cVert = [], cUV = [], cNorm = []; //Raw data
        var fVert = [], fUV = [], fNorm = [], fIndex = []; //Final rendering data

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

                            ind = (parseInt(vertexData[0]) - 1) * 3; //0-based indexing instead op 1-based
                            fVert.push(cVert[ind], cVert[ind + 1], cVert[ind + 2]);

                            ind = (parseInt(vertexData[1]) - 1) * 2;
                            fUV.push(cUV[ind], cUV[ind + 1]); //flip Y UV

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
        return [fVert, fUV, fNorm, fIndex];
    }
}