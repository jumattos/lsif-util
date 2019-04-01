import * as fse from 'fs-extra';
import { validate as validateSchema, ValidationError, ValidatorResult } from 'jsonschema';
import * as LSIF from 'lsif-protocol';
import * as TJS from 'typescript-json-schema';

let inputPath: string = './lsif.json';
const protocolPath: string = './node_modules/lsif-protocol/lib/protocol.d.ts';

const vertices: { [id: string]: Element } = {};
const edges: { [id: string]: Element } = {};
const visited: { [id: string]: boolean } = {};

const errors: Error[] = [];
const checks: boolean[] = [];

const numOfChecks: number = 2;
enum Check {
    vertexBeforeEdge = 0,
    allVerticesUsed
}

class Error {
    public element: LSIF.Element;
    public message: string;

    constructor(element: LSIF.Element, message: string) {
        this.element = element;
        this.message = message;
    }

    public print(): void {
        console.error(
            `${this.element.type.toUpperCase()} ${this.element.id}: FAIL> ${this.message}\n${JSON.stringify(this.element, undefined, 2)}`
        );
    }
}

class Element {
    public element: LSIF.Element;
    public valid: boolean;

    constructor(element: LSIF.Element) {
        this.element = element;
        this.valid = true;
    }

    public invalidate(): void {
        this.valid = false;
    }
}

class Statistics {
    public passed: number;
    public failed: number;
    public total: number;

    constructor(passed: number, failed: number) {
        this.passed = passed;
        this.failed = failed;
        this.total = passed + failed;
    }
}

async function main(argc: number, argv: string[]): Promise<void> {
    for (let i: number = 2; i < argc; i++) {
        switch (argv[i]) {
            case '--inputPath': case '-p':
                inputPath = argv[++i];
                break;
            default:
                console.error(`Unknown option: ${argv[i]}`);
        }
    }

    for (let i: number = 0; i < numOfChecks; i++) {
        checks.push(true);
    }

    await validate(await fse.readJSON(inputPath));
}

async function validate(toolOutput: LSIF.Element[]): Promise<boolean> {
    readInput(toolOutput);

    checkAllVisited();

    if (await fse.pathExists(protocolPath)) {
        checkVertices();
        checkEdges();
    } else {
        console.warn('Skipping thorough validation: protocol.d.ts was not found');
    }

    printOutput();

    return errors.length === 0;
}

function readInput(toolOutput: LSIF.Element[]): void {
    const outputMessage: string = 'Reading input...';
    process.stdout.write(`${outputMessage}\r`);

    for (const object of toolOutput) {
        if (object.type === 'edge') {
            const edge: LSIF.Edge = <LSIF.Edge> object;
            edges[edge.id.toString()] = new Element(edge);

            if (edge.inV === undefined || edge.outV === undefined) {
                errors.push(new Error(edge, `requires properties "inV" and "outV"`));
                edges[edge.id.toString()].invalidate();
                continue;
            }

            if (vertices[edge.inV.toString()] === undefined || vertices[edge.outV.toString()] === undefined) {
                errors.push(new Error(edge, `was emitted before a vertex it refers to`));
                edges[edge.id.toString()].invalidate();
                checks[Check.vertexBeforeEdge] = false;
            }

            visited[edge.inV.toString()] = visited[edge.outV.toString()] = true;
        } else if (object.type === 'vertex') {
            vertices[object.id.toString()] = new Element(object);
        } else {
            errors.push(new Error(object, `unknown element type`));
        }
    }

    console.log(`${outputMessage} done`);
}

function checkAllVisited(): void {
    Object.keys(vertices)
    .forEach((key: string) => {
        const vertex: LSIF.Vertex = <LSIF.Vertex> vertices[key].element;
        if (!visited[key] && vertex.label !== 'metaData') {
            errors.push(new Error(vertex, `not connected to any other vertex`));
            checks[Check.allVerticesUsed] = false;
        }
    });
}

function checkVertices(): void {
    let outputMessage: string;
    const program: TJS.Program = TJS.getProgramFromFiles([protocolPath]);
    const vertexSchema: TJS.Definition = TJS.generateSchema(program, 'Vertex', { required: true });
    let count: number = 1;
    const length: number = Object.keys(vertices).length;

    Object.keys(vertices)
    .forEach((key: string) => {
        const vertex: LSIF.Vertex = <LSIF.Vertex> vertices[key].element;
        outputMessage = `Verifying vertex ${count} of ${length}...`;
        process.stdout.write(`${outputMessage}\r`);
        count++;

        const validation: ValidatorResult = validateSchema(vertex, vertexSchema);
        if (!validation.valid) {
            let errorMessage: string;
            vertices[key].invalidate();

            if (vertex.label === undefined) {
                errorMessage = `requires property "label"`;
            } else if (!Object.values(LSIF.VertexLabels)
                        .includes(vertex.label)) {
                errorMessage = `unknown label`;
            } else {
                try {
                    const className: string = vertex.label[0].toUpperCase() + vertex.label.slice(1);
                    const specificSchema: TJS.Definition = TJS.generateSchema(program, className, { required: true });
                    const moreValidation: ValidatorResult = validateSchema(vertex, specificSchema);
                    errorMessage = '';
                    moreValidation.errors.forEach((error: ValidationError, index: number) => {
                        if (index > 0) {
                            errorMessage += '; ';
                        }
                        errorMessage += `${error.message}`;
                    });
                } catch {
                    // Failed to get more details for the error
                }
            }
            errors.push(new Error(vertex, errorMessage));
        }
    });
    console.log(`${outputMessage} done`);
}

function checkEdges(): void {
    let outputMessage: string;
    const program: TJS.Program = TJS.getProgramFromFiles([protocolPath]);
    const edgeSchema: TJS.Definition = TJS.generateSchema(program, 'Edge', { required: true, noExtraProps: true });
    let count: number = 1;
    const length: number = Object.keys(edges).length;

    Object.keys(edges)
    .forEach((key: string) => {
        const edge: LSIF.Edge = <LSIF.Edge> edges[key].element;
        outputMessage = `Verifying edge ${count} of ${length}...`;
        process.stdout.write(`${outputMessage}\r`);
        count++;

        const validation: ValidatorResult = validateSchema(edge, edgeSchema);
        if (!validation.valid) {
            let errorMessage: string;
            edges[key].invalidate();

            if (edge.inV === undefined || edge.outV === undefined) {
                // This error was caught before
                return;
            }

            if (edge.label === undefined) {
                errorMessage = `requires property "label"`;
            } else if (!Object.values(LSIF.EdgeLabels)
                        .includes(edge.label)) {
                errorMessage = `unknown label`;
            }
            errors.push(new Error(edges[key].element, errorMessage));
        }
    });
    console.log(`${outputMessage} done`);
}

function getCheckMessage(check: Check): string {
    switch (check) {
        case Check.vertexBeforeEdge:
            return 'vertices emitted before connecting edges';
        case Check.allVerticesUsed:
            return 'all vertices are used in at least one edge';
        // WIP
        // case Check.edgeDefinedVertices:
        //     return "edges exist only between defined vertices";
        default:
            return 'unexpected check';
    }
}

function printOutput(): void {
    console.log('\nResults:');
    for (let i: number = 0; i < numOfChecks; i++) {
        console.log(`\t${checks[i] ? 'PASS' : 'FAIL'}> ${getCheckMessage(i)}`);
    }
    console.log();

    const verticesStats: Statistics = getStatistics(vertices);
    console.log(`Vertices:\t${verticesStats.passed} passed, ${verticesStats.failed} failed, ${verticesStats.total} total`);

    const edgesStats: Statistics = getStatistics(edges);
    console.log(`Edges:\t\t${edgesStats.passed} passed, ${edgesStats.failed} failed, ${edgesStats.total} total`);

    errors.forEach((e: Error) => {
        console.log();
        e.print();
    });
}

function getStatistics(elements: { [id: string]: Element }): Statistics {
    let passed: number = 0;
    let failed: number = 0;

    Object.keys(elements)
    .forEach((key: string) => {
        const element: Element = elements[key];
        if (element.valid) {
            passed++;
        } else {
            failed++;
        }
    });

    return new Statistics(passed, failed);
}

main(process.argv.length, process.argv);
