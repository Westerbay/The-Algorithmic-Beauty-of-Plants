class TurtleMeshExporter {

    constructor() {}

    download(content, extension) {
		const blob = new Blob([content], { type: 'text/plain' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `scene.${extension}`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

    addLineObj(lines, vertices, normals, elements, colorIndices, offset=0, linePrimitive=false) {
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

        if (linePrimitive) {
            for (let i = 0; i < elements.length; i += 2) {
                const e1 = elements[i] + offset;
                const e2 = elements[i + 1] + offset;
                const line = `l ${e1} ${e2}`;
                if (lastMat == null || lastMat != colorIndices[elements[i]]) {
                    lines.push(`usemtl color${colorIndices[elements[i]] + 1}`);
                    lastMat = colorIndices[elements[i]];
                }
                lines.push(line);
            }
        }
        else {
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

    toObjAndMtl(mesh, linePrimitive, colors) {
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
        this.addLineObj(
            objLines,
            mesh.verticesLeaf,
            mesh.normalsLeaf,
            mesh.elementsLeaf,
            mesh.colorIndicesLeaf
        );

        if (!linePrimitive) {
            this.addLineObj(
                objLines,
                mesh.verticesRod,
                mesh.normalsRod,
                mesh.elementsRod,
                mesh.colorIndicesRod,
                mesh.verticesLeaf.length / 3
            );
        }
        else {
            this.addLineObj(
                objLines,
                mesh.verticesLine,
                mesh.normalsLine,
                mesh.elementsLine,
                mesh.colorIndicesLine,
                mesh.verticesLeaf.length / 3,
                true
            );
        }

        this.download(objLines.join('\n'), 'obj');
        this.download(mtlLines.join('\n'), 'mtl');
    }

}
