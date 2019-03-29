import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';

let inputPath: string = './lsif.json';
let distance: number = 1;
let verbose: boolean = false;
let targetIds: string[] = [];

async function main(argc: number, argv: string[]): Promise<void> {
    for (let i: number = 2; i < argc; i++) {
        switch (argv[i]) {
            case '--inputPath': case '-p':
                inputPath = argv[++i];
                break;
            case '--distance': case '-d':
                distance = parseInt(argv[++i], 10);
                break;
            case '--verbose': case '-v':
                verbose = true;
            default:
                const toPush: string[] = argv[i].split(' ');
                toPush.forEach((id: string) => {
                    targetIds.push(id);
                });
        }
    }

    if (targetIds.length === 0) {
        console.log(`Please specify at least one target vertex. Usage:\nnode ${argv[1]} [options] targetVertices`);

        return;
    }

    graph(await fse.readJSON(inputPath));
}

function graph(toolOutput: LSIF.Element[]): void {
    const edges: { [id: string]: LSIF.Element } = {};
    const vertices: { [id: string]: LSIF.Element } = {};

    const allEdges: LSIF.Element[] = toolOutput.filter((element: LSIF.Element) => element.type === 'edge');
    let idQeue: string[] = targetIds;
    while (distance > 0) {
        distance--;
        targetIds = idQeue;
        idQeue = [];

        allEdges.forEach((element: LSIF.Element) => {
            const edge: LSIF.Edge = <LSIF.Edge> element;
            const inV: string = edge.inV.toString();
            const outV: string = edge.outV.toString();
            if (targetIds.includes(inV) || targetIds.includes(outV)) {
                edges[edge.id] = edge;
                idQeue.push(inV, outV);
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
}

function printDOT(edges: { [id: string]: LSIF.Element }, vertices: { [id: string]: LSIF.Element }): void {
    let digraph: string = 'digraph LSIF {\n';

    Object.keys(vertices)
    .forEach((key: string) => {
        const vertex: LSIF.Vertex = <LSIF.Vertex> vertices[key];
        let extraText: string = '';

        if (verbose) {
            extraText = '\n';
            const extraInfo: LSIF.Vertex = JSON.parse(JSON.stringify(vertex));
            delete extraInfo.id;
            delete extraInfo.label;
            delete extraInfo.type;

            Object.keys(extraInfo)
            .forEach((property: string) => {
                const value: string = JSON.stringify(extraInfo[property]);
                const re: RegExp = new RegExp('"', 'g');
                extraText += `${property} = ${value.replace(re, '\\"')}\n`;
            });
        }

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

main(process.argv.length, process.argv);
