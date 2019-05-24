import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';
import * as yargs from 'yargs';
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

export async function main() {
    yargs
    .usage('Usage: $0 [validate|visualize] [file] --inputFormat=[line|json] [filters]')
    .command('validate [file]', '', yargs => {
        return yargs.positional('file', {
            describe: 'input file',
            default: './lsif.json'
        })
    }, argv => {
        validate(getInput(argv.inputFormat, argv.file), []);
    })
    .command('visualize [file]', '', yargs => {
        return yargs.positional('file', {
            describe: 'input file',
            default: './lsif.json'
        })
    }, argv => {
        visualize(getInput(argv.inputFormat, argv.file), []);
    })
    .demandCommand(1, 1) // One and only one command should be specified
    .option('inputFormat', { default: 'line', choices: ['line', 'json'], description: 'Specify input format' })
    .boolean('stdin')
    .option('id', { default: [], type: 'string', array: true, description: 'Filter by id' })
    .fail((message, error) => {
        if (error) throw error;
        yargs.showHelp('log');
        console.error(`\nError: ${message}`);
        process.exit(1);
    })
    .argv;
}

main();
