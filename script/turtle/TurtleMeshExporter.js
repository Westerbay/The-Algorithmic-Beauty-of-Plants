class TurtleMeshExporter {

    constructor() {}

    async downloadZip(files) {
        const zip = new JSZip();
        for (const [filename, content] of Object.entries(files)) {
            zip.file(filename, content);
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'LSystem.zip';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async download(content, ext) {
        const blob = new Blob([content], {type: "text/plain"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `LSystem.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async toPly(mesh, colors) {
        const numVertices = (mesh.verticesLeaf.length + mesh.verticesRod.length) / 3;
        const numFaces = (mesh.elementsLeaf.length + mesh.elementsRod.length) / 3;
        var lines = [];

        lines.push("ply");
        lines.push("format ascii 1.0");
        lines.push(`element vertex ${numVertices}`);
        lines.push("property float x");
        lines.push("property float y");
        lines.push("property float z");
        lines.push("property float nx");
        lines.push("property float ny");
        lines.push("property float nz");
        lines.push("property uchar red");
        lines.push("property uchar green");
        lines.push("property uchar blue");
        lines.push(`element face ${numFaces}`);
        lines.push("property list uchar int vertex_indices");
        lines.push("end_header");
        lines.push("");

        this._addVertexPly(
            lines,
            mesh.verticesLeaf,
            mesh.normalsLeaf,
            mesh.colorIndicesLeaf,
            colors
        );      
        
        this._addVertexPly(
            lines,
            mesh.verticesRod,
            mesh.normalsRod,
            mesh.colorIndicesRod,
            colors,
        );      

        this._addElementPly(
            lines,
            mesh.elementsLeaf,
        );      
        
        this._addElementPly(
            lines,
            mesh.elementsRod,
            mesh.verticesLeaf.length / 3
        );

        await this.download(lines.join("\n"), "ply");
    }

    _addVertexPly(lines, vertices, normals, colorIndices, colors) {
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i].toFixed(6);
            const y = vertices[i + 1].toFixed(6);
            const z = vertices[i + 2].toFixed(6);
            const nx = normals[i].toFixed(6);
            const ny = normals[i + 1].toFixed(6);
            const nz = normals[i + 2].toFixed(6);
            const colorIndex = colorIndices[i / 3];
            const r = Math.round(colors[colorIndex * 3] * 255);
            const g = Math.round(colors[colorIndex * 3 + 1] * 255);
            const b = Math.round(colors[colorIndex * 3 + 2] * 255);
            const line = `${x} ${z} ${y} ${nx} ${nz} ${ny} ${r} ${g} ${b}`;
            lines.push(line);
        }
    }

    _addElementPly(lines, elements, offset = 0) {
        for (let i = 0; i < elements.length; i += 3) {
            const e1 = elements[i] + offset;
            const e2 = elements[i + 1] + offset;
            const e3 = elements[i + 2] + offset;
            const line = `3 ${e1} ${e2} ${e3}`;
            lines.push(line);
        }
    }

    async toObjAndMtl(mesh, colors) {
        var objLines = [];
        var mtlLines = [];

        for (let i = 0; i < colors.length; i += 3) {
            const r = colors[i].toFixed(6);
            const g = colors[i + 1].toFixed(6);
            const b = colors[i + 2].toFixed(6);

            mtlLines.push(`newmtl color${i / 3 + 1}`);
            mtlLines.push(`Kd ${r} ${g} ${b}`);
            mtlLines.push("");
        }
      
        objLines.push("mtllib scene.mtl");
        this._addLineObj(
            objLines,
            mesh.verticesLeaf,
            mesh.normalsLeaf,
            mesh.elementsLeaf,
            mesh.colorIndicesLeaf
        );
        this._addLineObj(
            objLines,
            mesh.verticesRod,
            mesh.normalsRod,
            mesh.elementsRod,
            mesh.colorIndicesRod,
            mesh.verticesLeaf.length / 3
        );    

        const files = {
            "scene.obj": objLines.join('\n'),
            "scene.mtl": mtlLines.join('\n')
        };
        await this.downloadZip(files);
    }

    _addLineObj(lines, vertices, normals, elements, colorIndices, offset=0) {
        var lastMat = null;
        offset += 1;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i].toFixed(6);
            const y = vertices[i + 1].toFixed(6);
            const z = vertices[i + 2].toFixed(6);
            const line =  `v ${x} ${y} ${z}`;
            lines.push(line);
        }
        for (let i = 0; i < normals.length; i += 3) {
            const x = normals[i].toFixed(6);
            const y = normals[i + 1].toFixed(6);
            const z = normals[i + 2].toFixed(6);
            const line = `vn ${x} ${y} ${z}`;
            lines.push(line);
        }
        
        for (let i = 0; i < elements.length; i += 3) {
            const e1 = elements[i] + offset;
            const e2 = elements[i + 1] + offset;
            const e3 = elements[i + 2] + offset;
            const line = `f ${e1}//${e1} ${e2}//${e2} ${e3}//${e3}`;
            if (lastMat == null || lastMat != colorIndices[elements[i]]) {
                lines.push(`usemtl color${colorIndices[elements[i]] + 1}`);
                lastMat = colorIndices[elements[i]];
            }
            lines.push(line);
        } 
    }

}
