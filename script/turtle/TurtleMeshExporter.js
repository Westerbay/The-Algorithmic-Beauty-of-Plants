class TurtleMeshExporter {

    constructor() {}

    addLineObj(lines, vertices, normals, elements, offset=0, linePrimitive=false) {
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
                lines.push(line);
            }
        }
        else {
            for (let i = 0; i < elements.length; i += 3) {
                const e1 = elements[i] + offset;
                const e2 = elements[i + 1] + offset;
                const e3 = elements[i + 2] + offset;
                const line = `f ${e1}//${e1} ${e2}//${e2} ${e3}//${e3}`;
                lines.push(line);
            }
        }        
    }

    toObj(mesh, linePrimitive) {
        var lines = [];
      
        this.addLineObj(
            lines,
            mesh.verticesLeaf,
            mesh.normalsLeaf,
            mesh.elementsLeaf
        );

        if (!linePrimitive) {
            this.addLineObj(
                lines,
                mesh.verticesRod,
                mesh.normalsRod,
                mesh.elementsRod,
                mesh.verticesLeaf.length / 3
            );
        }
        else {
            this.addLineObj(
                lines,
                mesh.verticesLine,
                mesh.normalsLine,
                mesh.elementsLine,
                mesh.verticesLeaf.length / 3,
                true
            );
        }

        return lines.join('\n');
    }

}
