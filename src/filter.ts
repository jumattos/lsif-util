import * as LSIF from 'lsif-protocol';

export interface IFilter {
    id: string[],
    inV: string[],
    outV: string[],
    type: string[],
    label: string[],
    property: string[],
    regex: string
}

interface IParameter extends LSIF.Element {
    property: string;
    label: string;
}

export function getFilteredIds(argv: IFilter, input: LSIF.Element[]): string[] {
    let result: LSIF.Element[] = input;
    let { id, inV, outV, type, label, property, regex } = argv;

    result = result.filter(element => includes(id, element.id));
    result = result.filter(element => {
        const edge = element as LSIF.Edge;
        return includes(inV, edge.inV);
    });
    result = result.filter(element => {
        const edge = element as LSIF.Edge;
        return includes(outV, edge.outV);
    });
    result = result.filter(element => element.type && includes(type, element.type));
    result = result.filter(element => {
        const param = element as IParameter;
        return includes(label, param.label);
    });
    result = result.filter(element => {
        const param = element as IParameter;
        return includes(property, param.property);
    });
    result = result.filter(element => {
        return regex ? new RegExp(regex as string).test(JSON.stringify(element)) : true;
    });

    return result.map(element => element.id.toString());
}

function includes(array: string[], id: string | number) {
    return array.length > 0 ? id && array.includes(id.toString()) : true;
}