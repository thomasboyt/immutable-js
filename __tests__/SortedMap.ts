///<reference path='../resources/jest.d.ts'/>
///<reference path='../dist/immutable.d.ts'/>

jest.autoMockOff();

import { SortedMap } from 'immutable';

describe('SortedMap', () => {

  it('sorts inserted keys', () => {
    var m = SortedMap()
      .set('c', 'C')
      .set('a', 'A')
      .set('b', 'B');

    expect(m.toArray()).toEqual(['A', 'B', 'C']);
  });

  it('uses a provided comparator', () => {
    var m = SortedMap(undefined, (a, b) => a > b ? -1 : 1);
    m = m
      .set('c', 'C')
      .set('a', 'A')
      .set('b', 'B');

    expect(m.toArray()).toEqual(['C', 'B', 'A']);
  });

});
