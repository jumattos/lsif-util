import * as LSIF from 'lsif-protocol';

export function visualize(toolOutput: LSIF.Element[], ids: string[]): number {
    const edges: { [id: string]: LSIF.Element } = {};
    const vertices: { [id: string]: LSIF.Element } = {};
    let distance: number = 1;

    const allEdges: LSIF.Element[] = toolOutput.filter((element: LSIF.Element) => element.type === 'edge');
    let idQueue: string[] = [];
    ids.forEach(id => {
        const element = toolOutput.filter(element => element.id.toString() === id)[0];
        if (element.type === 'edge') {
            const edge = element as LSIF.Edge;
            idQueue.push(edge.inV.toString(), edge.outV.toString());
        }
        else {
            idQueue.push(element.id.toString())
        }
    });

    while (distance > 0) {
        distance--;
        ids = idQueue;
        idQueue = [];

        allEdges.forEach((element: LSIF.Element) => {
            const edge: LSIF.Edge = <LSIF.Edge> element;
            const inV: string = edge.inV.toString();
            const outV: string = edge.outV.toString();
            if (ids.includes(inV) || ids.includes(outV)) {
                edges[edge.id] = edge;
                idQueue.push(inV, outV);
            }
        });
    }

    Object.keys(edges)
    .forEach((key: string) => {
        const edge: LSIF.Edge = <LSIF.Edge> edges[key];
        const inV: LSIF.Element = toolOutput.filter((element: LSIF.Element) => element.id === edge.inV)[0];
        const outV: LSIF.Element = toolOutput.filter((element: LSIF.Element) => element.id === edge.outV)[0];

        vertices[inV.id.toString()] = inV;
        vertices[outV.id.toString()] = outV;
    });

    printDOT(edges, vertices);
    
    return 0;
}

function printDOT(edges: { [id: string]: LSIF.Element }, vertices: { [id: string]: LSIF.Element }): void {
    let digraph: string = 'digraph LSIF {\n';

    Object.keys(vertices)
    .forEach((key: string) => {
        const vertex: LSIF.Vertex = <LSIF.Vertex> vertices[key];
        let extraText: string = '';
        const extraInfo: LSIF.Vertex = JSON.parse(JSON.stringify(vertex));
        delete extraInfo.id;
        delete extraInfo.label;
        delete extraInfo.type;

        Object.keys(extraInfo)
        .forEach((property: string) => {
            const value: string = JSON.stringify(extraInfo[property]);
            const re: RegExp = new RegExp('"', 'g');
            extraText += `\n${property} = ${value.replace(re, '\\"')}`;
        });

        digraph += `  ${vertex.id} [label="[${vertex.id}] ${vertex.label}${extraText}"]\n`;
    });

    Object.keys(edges)
    .forEach((key: string) => {
        const edge: LSIF.Edge = <LSIF.Edge> edges[key];
        digraph += `  ${edge.outV} -> ${edge.inV} [label="${edge.label}"]\n`;
    });

    digraph += '}';

    console.log(digraph);
}
