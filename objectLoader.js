export default class objectLoader
{
    async loadObject(path)
    {
        const response = await fetch (path);
        const text = await response.text();

        this.result = this.parseObj(text);
        //Testing
        console.log(this.result[0] + "\n");
        console.log(this.result[1] + "\n");
        console.log(this.result[2] + "\n");
        console.log(this.result[3] + "\n");
    }

    getVertices() { return this.result[0]; }
    getUV() { return this.result[1]; }
    getNormals() { return this.result[2]; }
    getIndices() { return this.result[3]; }

    parseObj(data)
    {
        data = data.trim() + "\n";
        
        var cVert = [], cNorm = [], cUV = []; //Raw data
        var fVert = [], fNorm = [], fUV = []; //Final rendering data

        var line,
        itm,
        face_array,
        ind,
        i,
        isQuad = false,
        flipYUV = false,
        aCache = {}, //reusable vertices
        fIndex = [],
        fIndexCnt = 0

        var posA = 0
        var posB = data.indexOf("\n", 0);
        
        while (posB > posA)
        {
            line = data.substring(posA, posB).trim(); //removes surrounding whitespace and gathers text from point A to B

            switch(line.charAt(0))
            {
                case "v":
                    itm = line.split(" "); //creates an array of substrings divided by a single whitespace
                    itm.shift(); //removes first element
                    switch (line.charAt(1))
                    {
                        case " ": //Vertex position
                            cVert.push(parseFloat(itm[0]), parseFloat(itm[1]), parseFloat(itm[2])); //parseFloat converts string into floating-point representation
                            break;
                        case "t": //UV
                            cUV.push(parseFloat(itm[0]), parseFloat(itm[1]));
                            break;
                        case "n": //Normal
                            cNorm.push(parseFloat(itm[0]), parseFloat(itm[1]), parseFloat(itm[2]));
                            break;
                    }
                    break;
                case "f":
                    itm = line.split(" ");
                    itm.shift();
                    isQuad = false;

                    for (i = 0; i < itm.length; i++)
                    {
                        if (i == 3 && !isQuad) //on fourth vertex of face
                        {
                            i = 2;
                            isQuad = true;
                        }

                        if (itm[i] in aCache)
                        {
                            fIndex.push(aCache[itm[i]]);
                        }
                        else
                        {
                            face_array = itm[i].split("/"); //<vertex index>/<texture_uv_index>/<normal_index>

                            ind = (parseInt(face_array[0]) - 1) * 3; //0-based indexing instead op 1-based
                            fVert.push(cVert[ind], cVert[ind + 1], cVert[ind + 2]);

                            if (face_array[1] != "")
                            { 
                                ind = (parseInt(face_array[1]) - 1) * 2;
                                fUV.push(cUV[ind], (!flipYUV)? cUV[ind + 1] : 1 - cUV[ind + 1]);
                            }

                            ind = (parseInt(face_array[2]) - 1) * 3;
                            fNorm.push(cNorm[ind], cNorm[ind + 1], cNorm[ind + 2]);
                            
                            aCache[itm[i]] = fIndexCnt;
                            fIndex.push(fIndexCnt);
                            fIndexCnt++;
                        }

                        if (i == 3 && isQuad)
                        {
                            fIndex.push(aCache[itm[0]]);
                        }
                    }
                    break;
            }

            posA = posB + 1; //increment to next line
            posB = data.indexOf("\n", posA); //end of current line
        }
        return [fVert, fUV, fNorm, fIndex];
    }
}