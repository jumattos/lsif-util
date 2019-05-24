import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';
import * as yargs from 'yargs';
import { getFilteredIds, IFilter } from './filter';
import { validate } from './validate';
import { visualize } from './visualize';

function getInput(format: any, path: string): LSIF.Element[] {
    // TODO: support stdin (using the stdin flag or special file name `-`)
    switch (format) {
        case 'json':
            return fse.readJSONSync(path);
        case 'line': case undefined:
            return fse.readFileSync(path, 'utf8').split("\r\n").map(line => JSON.parse(line));
    }
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
        const input = getInput(argv.inputFormat, argv.file);
        const filter = <IFilter> <unknown>argv;
        validate(input, getFilteredIds(filter, input));
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
        const input = getInput(argv.inputFormat, argv.file);
        const filter = <IFilter> <unknown>argv;
        visualize(input, getFilteredIds(filter, input), argv.distance);
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
