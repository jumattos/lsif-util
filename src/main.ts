import * as fse from 'fs-extra';
import * as LSIF from 'lsif-protocol';
import * as yargs from 'yargs';
import { validate } from './validate';
import { visualize } from './visualize';

function getInput(format: any, path: string): LSIF.Element[] {
    switch (format) {
        case 'json':
            return fse.readJSONSync(path);
        case 'line': case undefined:
            return fse.readFileSync(path, 'utf8').split("\r\n").map(line => JSON.parse(line));
    }
}

export async function main() {
    yargs
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
    .option('inputFormat', { default: 'line', choices: ['line', 'json'], description: 'Specify input format' })
    .argv;
}

main();
