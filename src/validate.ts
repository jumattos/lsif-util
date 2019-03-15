import * as fs from 'fs';

let inputPath: string = "./lsif.json";

function main(argc: number, argv: string[]) {
    for (let i = 2; i < argc;) {
        switch (argv[i]) {
            case "--inputPath": case "-p":
                inputPath = argv[++i];
                break;
        }
    }

    fs.readFile(inputPath, (err, data) => {
        if (err) {
            throw err;
        }
        
        if (validate(JSON.parse(data.toString()))) {
            console.log("Valid LSIF");
        }
        else {
            console.log("Invalid LSIF");
        }
    });
}

function validate(toolOutput: any[]): boolean {
    let edges: { [id: string]: any } = {};
    let vertices: { [id: string]: any } = {};
    let valid: boolean = true;

    toolOutput.forEach(object => {
        if (object.type === "edge") {
            // If a vertex was not emitted before an edge that refer to it
            if (!vertices[object.inV.toString()] || !vertices[object.outV.toString()]) {
                valid = false;
            }
            edges[object.id.toString()] = object;
        }
        else if (object.type === "vertex") {
            vertices[object.id.toString()] = object;
        }
        else {
            // Only two types are valid: edge and vertex
            valid = false;
        }
    });

    return valid;
}

main(process.argv.length, process.argv);
