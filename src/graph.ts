import * as fs from 'fs';

let inputPath: string = "./lsif.json";
let distance: number = 1;
let verbose: boolean = false;
let targetIds: string[] = [];

function main(argc: number, argv: string[]) {
    for (let i = 2; i < argc; i++) {
        switch (argv[i]) {
            case "--inputPath": case "-p":
                inputPath = argv[++i];
                break;
            case "--distance": case "-d":
                distance = parseInt(argv[++i]);
                break;
            case "--verbose": case "-v":
                verbose = true;
            default:
                targetIds.push(argv[i]);
        }
    }

    fs.readFile(inputPath, (err, data) => {
        if (err) {
            throw err;
        }
        graph(JSON.parse(data.toString()));
    });
}

function graph(toolOutput: any[]) {
    let edges: { [id: string]: any } = {};
    let vertices: { [id: string]: any } = {};

    let allEdges = toolOutput.filter(object => object.type === "edge");
    let idQeue: string[] = targetIds;
    while(distance > 0) {
        distance--;
        targetIds = idQeue;
        idQeue = [];

        allEdges.forEach(edge => {
            let inV = edge.inV.toString();
            let outV = edge.outV.toString();
            if (targetIds.includes(inV) || targetIds.includes(outV)) {
                edges[edge.id] = edge;
                idQeue.push(inV, outV);
            }
        });
    }

    for (let key in edges) {
        let edge = edges[key];
        
        let inV = toolOutput.filter(object => object.id === edge.inV)[0];
        let outV = toolOutput.filter(object => object.id === edge.outV)[0];

        vertices[inV.id.toString()] = inV;
        vertices[outV.id.toString()] = outV;
    }

    printDOT(edges, vertices);
}

function printDOT(edges, vertices): void {
    let digraph = "digraph LSIF {\n";
    
    for (let key in vertices) {
        let vertex = vertices[key];
        let extraText = "";
        
        if (verbose) {
            extraText = "\n";
            let extraInfo = JSON.parse(JSON.stringify(vertex));
            delete extraInfo.id;
            delete extraInfo.label;
            delete extraInfo.type;
            
            for (let property in extraInfo) {
                let value = JSON.stringify(extraInfo[property]);
                let re = new RegExp("\"", 'g');
                extraText += `${property} = ${value.replace(re, "\\\"")}\n`
            }
        }

        digraph += `  ${vertex.id} [label="[${vertex.id}] ${vertex.label}${extraText}"]\n`
    }

    for (let key in edges) {
        let edge = edges[key];
        digraph += `  ${edge.outV} -> ${edge.inV} [label="${edge.label}"]\n`
    }

    digraph += "}";

    console.log(digraph);
}

main(process.argv.length, process.argv);
