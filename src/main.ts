import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';
import * as yargs from 'yargs';
import { validate } from './validate';
import { visualize } from './visualize';

interface IParameter extends LSIF.Element {
    property: string;
    label: string;
}

function getInput(format: any, path: string): LSIF.Element[] {
    // TODO: support stdin (using the stdin flag or special file name `-`)
    switch (format) {
        case 'json':
            return fse.readJSONSync(path);
        case 'line': case undefined:
            return fse.readFileSync(path, 'utf8').split("\r\n").map(line => JSON.parse(line));
    }
}

function getIds(argv: yargs.Arguments, input: LSIF.Element[]): string[] {
    let result: LSIF.Element[] = input;
    let { id, inV, outV, type, label, property, regex } = argv;

    result = result.filter(element => filter(id, element.id));
    result = result.filter(element => {
        const edge = element as LSIF.Edge;
        return filter(inV, edge.inV);
    });
    result = result.filter(element => {
        const edge = element as LSIF.Edge;
        return filter(outV, edge.outV);
    });
    result = result.filter(element => element.type && filter(type, element.type));
    result = result.filter(element => {
        const param = element as IParameter;
        return filter(label, param.label);
    });
    result = result.filter(element => {
        const param = element as IParameter;
        return filter(property, param.property);
    });
    result = result.filter(element => {
        return regex && new RegExp(regex as string).test(JSON.stringify(element));
    });

    return result.map(element => element.id.toString());
}

function filter(object: any, id: string | number) {
    let array = object as string[];
    return array.length > 0 ? id && array.includes(id.toString()) : true;
}

export async function main() {
    yargs
    .usage('Usage: $0 [validate|visualize] [file] --inputFormat=[line|json] [filters]')
    .command('validate [file]', '', yargs => {
        return yargs.positional('file', {
            describe: 'input file',
            default: './lsif.json'
        })
    }, argv => {
        const input = getInput(argv.inputFormat, argv.file);
        validate(input, getIds(argv, input));
    })
    .command('visualize [file]', '', yargs => {
        return yargs.positional('file', {
            describe: 'input file',
            default: './lsif.json'
        })
    }, argv => {
        const input = getInput(argv.inputFormat, argv.file);
        visualize(input, getIds(argv, input));
    })
    .demandCommand(1, 1) // One and only one command should be specified
    .option('inputFormat', { default: 'line', choices: ['line', 'json'], description: 'Specify input format' })
    .boolean('stdin')
    .option('id', { default: [], type: 'string', array: true, description: 'Filter by id' })
    .option('inV', { default: [], type: 'string', array: true, description: 'Filter by inV' })
    .option('outV', { default: [], type: 'string', array: true, description: 'Filter by outV' })
    .option('type', { default: [], type: 'string', array: true, description: 'Filter by type' })
    .option('label', { default: [], type: 'string', array: true, description: 'Filter by label' })
    .option('property', { default: [], type: 'string', array: true, description: 'Filter by property' })
    .option('regex', { default: [], type: 'string', description: 'Filter by regex' })
    .fail((message, error) => {
        if (error) throw error;
        yargs.showHelp('log');
        console.error(`\nError: ${message}`);
        process.exit(1);
    })
    .argv;
}

main();
