import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';
import * as readline from 'readline';
import * as yargs from 'yargs';
import { getFilteredIds, IFilter } from './filter';
import { validate } from './validate';
import { visualize } from './visualize';

function readInput(format: any, path: string, callback: (input: LSIF.Element[]) => void) {
    let inputStream: NodeJS.ReadStream | fse.ReadStream = process.stdin;
    if (path) {
        inputStream = fse.createReadStream(path);
    }

    let input: LSIF.Element[] = [];
    let buffer: string[] = [];
    const rd = readline.createInterface(inputStream);
    rd.on('line', line => {
        switch (format) {
            case 'json':
                buffer.push(line);
            case 'line': default:
                input.push(JSON.parse(line));
        }
    });

    rd.on('close', () => {
        if (buffer.length > 0) {
            input = JSON.parse(buffer.join());
        }

        callback(input);
    });
}

async function main() {
    yargs
    .usage('Usage: $0 [validate|visualize] [file] --inputFormat=[line|json] [filters]')
    .command('validate [file]', '', yargs => {
        return yargs.positional('file', {
            describe: 'input file',
            default: './lsif.json'
        })
    }, argv => {
        readInput(argv.inputFormat, argv.stdin ? undefined : argv.file, input => {
            const filter = <IFilter> <unknown>argv;
            validate(input, getFilteredIds(filter, input));
        });
    })
    .command('visualize [file]', '', yargs => {
        return yargs
        .positional('file', {
            describe: 'input file',
            default: './lsif.json'
        })
        .option('distance', {
            describe: 'Max distance between any vertex and the filtered input',
            default: 1
        })
    }, argv => {
        readInput(argv.inputFormat, argv.stdin ? undefined : argv.file, input => {
            const filter = <IFilter> <unknown>argv;
            visualize(input, getFilteredIds(filter, input), argv.distance);
        });
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
    .option('regex', { type: 'string', description: 'Filter by regex' })
    .fail((message, error) => {
        if (error) throw error;
        yargs.showHelp('log');
        console.error(`\nError: ${message}`);
        process.exit(1);
    })
    .help('info', 'Show usage information')
    .argv;
}

main();
