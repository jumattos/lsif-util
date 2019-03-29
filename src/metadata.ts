/* LSIF Protocol Metadata Tool
 * Objective: translating the LSIF protocol into metadata that can be quickly scanned
 *
 * Example (protocol.ts):
 * export type contains = E<Project, Document, EdgeLabels.contains> | E<Document, Range, EdgeLabels.contains>;
 * export type refersTo = E<Range, ResultSet, EdgeLabels.refersTo>;
 *
 * Possible output:
 * [
 *     {
 *         label: "contains",
 *         relations: [
 *             { outV: "project", inV: "document" },
 *             { outV: "document", inV: "range" }
 *         ]
 *     },
 *     {
 *         label: "refersTo",
 *         relations: [
 *             { outV: "range", inV: "resultSet" }
 *         ]
 *     }
 * ]
 */

import * as fs from 'fs';
import * as ts from 'typescript';

const protocolFile: string[] = ['C:/Users/jumattos/source/repos/Example_TSC_LSIF/Example_TSC_LSIF/app.ts'];

interface EdgeMetadata {
    label: string;
    relations: Relation[];
}

interface Relation {
    outV: string;
    inV: string;
}

const program = ts.createProgram({rootNames: protocolFile, options: ts.getDefaultCompilerOptions()});
const checker = program.getTypeChecker();

export function getEdgeMetadata(): EdgeMetadata[] {
    const metadata: EdgeMetadata[] = [];

    // TODO: this should be done programatically
    // metadata.push({label: "contains", relations: [{outV: "document", inV: "range"}, {outV: "project", inV: "document"}]});
    // metadata.push({label: "refersTo", relations: [{outV: "range", inV: "resultSet"}]});

    for (const file of program.getSourceFiles()) {
        ts.forEachChild(file, visit);
    }

    return metadata;
}

function visit(node: ts.Node): void {
    if (ts.isTypeAliasDeclaration(node) && node.name) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol.getName() === 'myType') {
            console.log(node.typeParameters);
        }
    }
}

getEdgeMetadata();
