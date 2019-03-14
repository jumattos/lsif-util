import * as fs from 'fs';

let inputPath: string = "./lsif.json";
let ids: string[] = [];
let inVs: string[] = [];
let outVs: string[] = [];
let types: string[] = [];
let labels: string[] = [];
let properties: string[] = [];
let regex: string;
let idOnly: boolean = false;

function main(argc: number, argv: string[]) {
    let options: string[] = ["--inputPath", "-p", "-id", "-inV", "-outV", "-type", "-label", "-property", "-regex", "--idOnly", "-i"];
    for (let i = 2; i < argc;) {
        switch (argv[i]) {
            case "--inputPath": case "-p":
                inputPath = argv[++i];
                i++;
                break;
            case "-id":
                i++;
                while(i < argc && !options.includes(argv[i])) {
                    ids.push(argv[i++]);
                }
                break;
            case "-inV":
                i++;
                while(i < argc && !options.includes(argv[i])) {
                    inVs.push(argv[i++]);
                }
                break;
            case "-outV":
                i++;
                while(i < argc && !options.includes(argv[i])) {
                    outVs.push(argv[i++]);
                }
                break;
            case "-type":
                i++;
                while(i < argc && !options.includes(argv[i])) {
                    types.push(argv[i++]);
                }
                break;
            case "-label":
                i++;
                while(i < argc && !options.includes(argv[i])) {
                    labels.push(argv[i++]);
                }
                break;
            case "-property":
                i++;
                while(i < argc && !options.includes(argv[i])) {
                    properties.push(argv[i++]);
                }
                break;
            case "-regex":
                regex = argv[++i];
                i++;
                break;
            case "--idOnly": case "-i":
                idOnly = true;
                i++;
        }
    }

    fs.readFile(inputPath, (err, data) => {
        if (err) {
            throw err;
        }
        search(JSON.parse(data.toString()));
    });
}

function search(toolOutput: any[]) {
    let result: any[] = toolOutput;

    if (ids.length > 0) {
        result = result.filter(object => (object.id) && ids.includes(object.id.toString()));
    }

    if (inVs.length > 0) {
        result = result.filter(object => (object.inV) && inVs.includes(object.inV.toString()));
    }
    
    if (outVs.length > 0) {
        result = result.filter(object => (object.outV) && outVs.includes(object.outV.toString()));
    }

    if (types.length > 0) {
        result = result.filter(object => (object.type) && types.includes(object.type.toString()));
    }

    if (labels.length > 0) {
        result = result.filter(object => (object.label) && labels.includes(object.label.toString()));
    }

    if (properties.length > 0) {
        result = result.filter(object => (object.property) && properties.includes(object.property.toString()));
    }

    if (regex) {
        let regexp = new RegExp(regex);
        result = result.filter(object => regexp.test(JSON.stringify(object)));
    }

    if (idOnly) {
        let idList: string[] = result.map(object => object.id.toString());
        console.log(idList.join(" "));
    }
    else {
        console.log(JSON.stringify(result, null, 2));
    }
}

main(process.argv.length, process.argv);
