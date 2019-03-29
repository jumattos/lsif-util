import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';

let inputPath: string = './lsif.json';
const ids: string[] = [];
const inVs: string[] = [];
const outVs: string[] = [];
const types: string[] = [];
const labels: string[] = [];
const properties: string[] = [];
let regex: string;
let idOnly: boolean = false;
let index: number;

interface IParameter extends LSIF.Element {
    property: string;
    label: string;
}

async function main(argc: number, argv: string[]): Promise<void> {
    index = 2;
    while (index < argc) {
        switch (argv[index]) {
            case '--inputPath': case '-p':
                inputPath = argv[++index];
                index++;
                break;
            case '-id':
                readIds(argc, argv, ids);
                break;
            case '-inV':
                readIds(argc, argv, inVs);
                break;
            case '-outV':
                readIds(argc, argv, outVs);
                break;
            case '-type':
                readIds(argc, argv, types);
                break;
            case '-label':
                readIds(argc, argv, labels);
                break;
            case '-property':
                readIds(argc, argv, properties);
                break;
            case '-regex':
                regex = argv[++index];
                index++;
                break;
            case '--idOnly': case '-i':
                idOnly = true;
                index++;
            default:
                console.error(`Unknown option: ${argv[index]}`);
        }
    }

    search(await fse.readJSON(inputPath));
}

function readIds(argc: number, argv: string[], array: string[]): void {
    const options: string[] = ['--inputPath', '-p', '-id', '-inV', '-outV', '-type', '-label', '-property', '-regex', '--idOnly', '-i'];
    index++;
    while (index < argc && !options.includes(argv[index])) {
        const toPush: string[] = argv[index++].split(' ');
        toPush.forEach((id: string) => {
            array.push(id);
        });
    }
}

function search(toolOutput: LSIF.Element[]): void {
    let result: LSIF.Element[] = toolOutput;

    if (ids.length > 0) {
        result = result.filter((object: LSIF.Element) => (object.id !== undefined) && ids.includes(object.id.toString()));
    }

    if (inVs.length > 0) {
        result = result.filter((element: LSIF.Element) => {
            const edge: LSIF.Edge = <LSIF.Edge> element;

            return edge.inV !== undefined && inVs.includes(edge.inV.toString());
        });
    }

    if (outVs.length > 0) {
        result = result.filter((element: LSIF.Element) => {
            const edge: LSIF.Edge = <LSIF.Edge> element;

            return edge.outV !== undefined && outVs.includes(edge.outV.toString());
        });
    }

    if (types.length > 0) {
        result = result.filter((element: LSIF.Element) => element.type !== undefined && types.includes(element.type.toString()));
    }

    if (labels.length > 0) {
        result = result.filter((element: LSIF.Element) => {
            const param: IParameter = <IParameter> <unknown> element;

            return param.label !== undefined && labels.includes(param.label.toString());
        });
    }

    if (properties.length > 0) {
        result = result.filter((element: LSIF.Element) => {
            const param: IParameter = <IParameter> <unknown> element;

            return param.property !== undefined && properties.includes(param.property.toString());
        });
    }

    if (regex !== undefined) {
        const regexp: RegExp = new RegExp(regex);
        result = result.filter((object: LSIF.Element) => regexp.test(JSON.stringify(object)));
    }

    if (idOnly) {
        const idList: string[] = result.map((object: LSIF.Element) => object.id.toString());
        console.log(idList.join(' '));
    } else {
        console.log(JSON.stringify(result, undefined, 2));
    }
}

main(process.argv.length, process.argv);
