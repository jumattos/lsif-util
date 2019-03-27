import * as fse from 'fs-extra';
import * as TJS from 'typescript-json-schema';
import { validate as validateSchema } from 'jsonschema';

let inputPath: string = "./lsif.json";
let protocolPath: string = "../lsif-typescript/tsc-lsif/src/shared/protocol.ts";

let vertices: { [id: string]: Element } = {};
let edges: { [id: string]: Element } = {};
let visited: { [id: string]: boolean } = {};

let errors: Error[] = [];
let checks: boolean[] = [];

let numOfChecks = 2;
enum Check {
    vertexBeforeEdge = 0,
    allVerticesUsed
}

class Error {
    element: any;
    message: string;

    constructor(element: any, message: string) {
        this.element = element;
        this.message = message;
    }

    print(): void {
        console.error(`${this.element.type.toUpperCase()} ${this.element.id}: FAIL> ${this.message}\n${JSON.stringify(this.element, null, 2)}`);
    }
}

class Element {
    element: any;
    valid: boolean;

    constructor(element: any) {
        this.element = element;
        this.valid = true;
    }

    invalidate(): void {
        this.valid = false;
    }
}

async function main(argc: number, argv: string[]): Promise<void> {
    for (let i = 2; i < argc; i++) {
        switch (argv[i]) {
            case "--inputPath": case "-p":
                inputPath = argv[++i];
                break;
        }
    }

    for (let i = 0; i < numOfChecks; i++) {
        checks.push(true);
    }

    await validate(await fse.readJSON(inputPath));
}

async function validate(toolOutput: any[]): Promise<boolean> {
    readInput(toolOutput);

    checkAllVisited();
    
    if (await fse.pathExists(protocolPath)) {
        checkVertices();
        checkEdges();
    }
    else {
        console.warn("Skipping thorough validation. For more information, check README");
    }

    printOutput();

    return errors.length === 0;
}

function readInput(toolOutput: any[]): void {
    let outputMessage = "Reading input...";
    process.stdout.write(`${outputMessage}\r`);

    for (let i = 0; i < toolOutput.length; i++) {
        const object = toolOutput[i];

        if (object.type === "edge") {
            edges[object.id.toString()] = new Element(object);

            if (!object.inV || !object.outV) {
                errors.push(new Error(object, `requires properties "inV" and "outV"`));
                edges[object.id.toString()].invalidate();
                continue;
            }

            if (!vertices[object.inV.toString()] || !vertices[object.outV.toString()]) {
                errors.push(new Error(object, `was emitted before a vertex it refers to`));
                edges[object.id.toString()].invalidate();
                checks[Check.vertexBeforeEdge] = false;
            }

            visited[object.inV.toString()] = visited[object.outV.toString()] = true;
        }
        else if (object.type === "vertex") {
            vertices[object.id.toString()] = new Element(object);
        }
        else {
            errors.push(new Error(object, `unknown element type`));
        }
    }

    console.log(`${outputMessage} done`);
}

function checkAllVisited(): void {
    for (let key in vertices) {
        if (!visited[key] && vertices[key].element.label !== "metaData"){
            errors.push(new Error(vertices[key].element, `not connected to any other vertex`));
            checks[Check.allVerticesUsed] = false;
        }
    }
}

function checkVertices(): void {
    let outputMessage: string;
    const program = TJS.getProgramFromFiles([protocolPath]);
    const vertexSchema = TJS.generateSchema(program, "Vertex", { required: true });
    let count = 1;
    let length = Object.keys(vertices).length;

    for (let key in vertices) {
        outputMessage = `Verifying vertex ${count} of ${length}...`;
        process.stdout.write(`${outputMessage}\r`);
        count++;

        const validation = validateSchema(vertices[key].element, vertexSchema);
        if (!validation.valid) {
            let errorMessage: string;
            vertices[key].invalidate();

            if (!vertices[key].element.label || vertices[key].element.label === "") {
                errorMessage = `requires property "label"`;
            }
            else {
                try {
                    let className = vertices[key].element.label[0].toUpperCase() + vertices[key].element.label.slice(1);
                    let specificSchema = TJS.generateSchema(program, className, { required: true });
                    let moreValidation = validateSchema(vertices[key].element, specificSchema);
                    errorMessage = "";
                    moreValidation.errors.forEach((error, index) => {
                        if (index > 0) {
                            errorMessage += "; ";
                        }
                        errorMessage += `${error.message}`;
                    });
                }
                catch {
                    // Failed to get more details for the error
                }
            }
            errors.push(new Error(vertices[key].element, errorMessage));
        }
    }
    console.log(`${outputMessage} done`);
}

function checkEdges(): void {
    let outputMessage: string;
    const program = TJS.getProgramFromFiles([protocolPath]);
    const edgeSchema = TJS.generateSchema(program, "Edge", { required: true, noExtraProps: true });
    let count = 1;
    let length = Object.keys(edges).length;
    for (let key in edges) {
        outputMessage = `Verifying edge ${count} of ${length}...`;
        process.stdout.write(`${outputMessage}\r`);
        count++;

        const validation = validateSchema(edges[key].element, edgeSchema);
        if (!validation.valid) {
            let errorMessage: string;
            edges[key].invalidate();

            if (!edges[key].element.inV || !edges[key].element.outV) {
                // This error was caught before
                continue;
            }

            if (!edges[key].element.label || edges[key].element.label === "") {
                errorMessage = `requires property "label"`;
            }
            else {
                errorMessage = `unknown label`;
            }
            errors.push(new Error(edges[key].element, errorMessage));
        }
    }
    console.log(`${outputMessage} done`);
}

function getCheckMessage(check: Check): string {
    switch (check) {
        case Check.vertexBeforeEdge:
            return "vertices emitted before connecting edges";
        case Check.allVerticesUsed:
            return "all vertices are used in at least one edge";
        // WIP
        // case Check.edgeDefinedVertices:
        //     return "edges exist only between defined vertices";
    }
}

function printOutput(): void {
    console.log("\nResults:");
    for (let i = 0; i < numOfChecks; i++) {
        console.log(`\t${checks[i]? 'PASS' : 'FAIL'}> ${getCheckMessage(i)}`);
    }
    console.log();

    let passed = 0, failed = 0, total = 0;
    for (let key in vertices) {
        const vertex = vertices[key];
        if (vertex.valid) {
            passed++;
        }
        else {
            failed++;
        }
        total++;
    }
    console.log(`Vertices:\t${passed} passed, ${failed} failed, ${total} total`);

    passed = 0; failed = 0; total = 0;
    for (let key in edges) {
        const edge = edges[key];
        if (edge.valid) {
            passed++;
        }
        else {
            failed++;
        }
        total++;
    }
    console.log(`Edges:\t\t${passed} passed, ${failed} failed, ${total} total`);

    errors.forEach(e => {
        console.log();
        e.print();
    });
}

main(process.argv.length, process.argv);
