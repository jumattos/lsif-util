import * as fs from 'fs';
import * as TJS from 'typescript-json-schema';
import { validate as validateSchema } from 'jsonschema';

let inputPath: string = "./lsif.json";
let protocolPath: string = "../lsif-typescript/tsc-lsif/src/shared/protocol.ts";
let verbose: boolean = false;

function main(argc: number, argv: string[]) {
    for (let i = 2; i < argc; i++) {
        switch (argv[i]) {
            case "--inputPath": case "-p":
                inputPath = argv[++i];
                break;
            case "--verbose": case "-v":
                verbose = true;
                break;
        }
    }

    fs.readFile(inputPath, (err, data) => {
        if (err) {
            throw err;
        }
        
        if (validate(JSON.parse(data.toString()))) {
            console.log("LSIF valid");
        }
    });
}

function validate(toolOutput: any[]): boolean {
    let edges: { [id: string]: any } = {};
    let vertices: { [id: string]: any } = {};
    let visited: { [id: string]: boolean } = {};
    let outputMessage = "Reading input...";

    /*
     * Check #1: vertices are emitted before connecting edges
     */
    process.stdout.write(`${outputMessage}\r`);
    for (let i = 0; i < toolOutput.length; i++) {
        const object = toolOutput[i];

        if (object.type === "edge") {
            if (!object.inV || !object.outV) {
                console.log(`${outputMessage} error`);
                console.error(`Edge ${object.id} requires properties "inV" and "outV"`);
                return false;
            }

            // If a vertex was not emitted before an edge that refer to it
            if (!vertices[object.inV.toString()] || !vertices[object.outV.toString()]) {
                console.log(`${outputMessage} error`);
                console.error(`Edge ${object.id} was emitted before the vertices it refers to.`);
                return false;
            }
            edges[object.id.toString()] = object;
            visited[object.inV.toString()] = visited[object.outV.toString()] = true;
        }
        else if (object.type === "vertex") {
            vertices[object.id.toString()] = object;
        }
        else {
            // Only two types are valid: edge and vertex
            console.log(`${outputMessage} error`);
            console.error(`Unknown element type: ${object.type}.`);
            return false;
        }
    }
    console.log(`${outputMessage} done`);
    printPass("Vertices are emitted before connecting edges");

    /*
     * Check #2: vertices are used in at least one edge
     */
    for (let key in vertices) {
        if (!visited[key] && vertices[key].label !== "metaData"){
            console.error(`Vertex ${key} is not connected to any other`);
            return false;
        }
    }
    printPass("Vertices are used in at least one edge");

    /*
     * Thorough validation
     */
    if (fs.existsSync(protocolPath)) {
        const program = TJS.getProgramFromFiles([protocolPath]);

        /*
         * Check #3: vertices properties are correct
         */
        const vertexSchema = TJS.generateSchema(program, "Vertex", { required: true });
        let count = 1;
        let length = Object.keys(vertices).length;
        for (let key in vertices) {
            outputMessage = `Verifying vertex ${count} of ${length}...`;
            process.stdout.write(`${outputMessage}\r`);
            count++;

            const validation = validateSchema(vertices[key], vertexSchema);
            if (!validation.valid) {
                console.log(`${outputMessage} error`);
                console.error(`Vertex ${key} is not valid:\n${JSON.stringify(vertices[key], null, 2)}`);

                if (!vertices[key].label || vertices[key].label === "") {
                    printError(`requires property "label"`);
                }
                else {
                    try {
                        let className = vertices[key].label[0].toUpperCase() + vertices[key].label.slice(1);
                        let specificSchema = TJS.generateSchema(program, className, { required: true });
                        let moreValidation = validateSchema(vertices[key], specificSchema);
                        moreValidation.errors.forEach(error => {
                            printError(error.message);
                        });
                    }
                    catch {
                        // Failed to get more details for the error
                    }
                }
                return false;
            }
        }
        console.log(`${outputMessage} done`);
        printPass("Vertices properties are correct");

        /*
         * Check #4: edges properties are correct
         */
        const edgeSchema = TJS.generateSchema(program, "Edge", { required: true, noExtraProps: true });
        count = 1;
        length = Object.keys(edges).length;
        for (let key in edges) {
            outputMessage = `Verifying edge ${count} of ${length}...`;
            process.stdout.write(`${outputMessage}\r`);
            count++;

            const validation = validateSchema(edges[key], edgeSchema);
            if (!validation.valid) {
                console.log(`${outputMessage} error`);
                console.error(`Edge ${key} is not valid:\n${JSON.stringify(edges[key], null, 2)}`);
                
                // Since we checked for inV and outV before, the only possible problem is the label
                if (!edges[key].label || edges[key].label === "") {
                    printError(`requires property "label"`);
                }
                else {
                    printError(`unknown label: "${edges[key].label}"`);
                }
                return false;
            }
        }
        console.log(`${outputMessage} done`);
        printPass("Edges properties are correct");
    }
    else {
        console.warn("Skipping thorough validation. For more information, check README");
    }

    return true;
}

function printPass(message: string) {
    if (verbose) {
        console.log(`PASSED -> ${message}`);
    }
}

function printError(message: string) {
    console.error(`ERROR -> ${message}`);
}

main(process.argv.length, process.argv);
