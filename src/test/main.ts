import * as LSIF from 'lsif-protocol';
import { getFilteredIds } from '../filter';

const emptyFilter = {
    id: [], inV: [], outV: [], type: [], label: [], property: [], regex: undefined
}

const mockInput = [
    { id: '1', type: LSIF.ElementTypes.vertex }
]

describe('The main console-line interface', () => {
    describe('The filters', () => {
        it('Should return the whole input if no filter is specified', () => {
            const ids = getFilteredIds(emptyFilter, mockInput).length;
            expect(ids).toEqual(mockInput.length);
        })
    })
});