/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { OrderedMap } from './OrderedMap'
import { NOT_SET, SIZE } from './TrieUtils'
import { Map, emptyMap } from './Map'
import { emptyList } from './List'

export class SortedMap extends OrderedMap {
  // @pragma Construction

  constructor(value, comparator) {
    this._comparator = comparator;
    return emptySortedMap(comparator);
  }

  toString() {
    return this.__toString('SortedMap {', '}');
  }

  // @pragma Access

  get(k, notSetValue) {
    var index = this._map.get(k);
    return index !== undefined ? this._list.get(index)[1] : notSetValue;
  }

  // @pragma Modification

  clear() {
    if (this.size === 0) {
      return this;
    }
    if (this.__ownerID) {
      this.size = 0;
      this._map.clear();
      this._list.clear();
      return this;
    }
    return emptySortedMap(this._comparator);
  }

  set(k, v) {
    return updateSortedMap(this, k, v);
  }

  remove(k) {
    return updateSortedMap(this, k, NOT_SET);
  }

  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    var newMap = this._map.__ensureOwner(ownerID);
    var newList = this._list.__ensureOwner(ownerID);
    if (!ownerID) {
      this.__ownerID = ownerID;
      this._map = newMap;
      this._list = newList;
      return this;
    }
    return makeSortedMap(newMap, newList, this._comparator, ownerID, this.__hash);
  }
}


function makeSortedMap(map, list, comparator, ownerID, hash) {
  var smap = Object.create(SortedMap.prototype);
  smap.size = map ? map.size : 0;
  smap._map = map;
  smap._list = list;
  smap._comparator = comparator;
  smap.__ownerID = ownerID;
  smap.__hash = hash;
  return smap;
}

function updateSortedMap(smap, k, v) {
  var map = smap._map;
  var list = smap._list;
  var comparator = smap._comparator;
  var i = map.get(k);
  var has = i !== undefined;
  var newMap;
  var newList;

  if (v === NOT_SET) { // removed. theoretically this should be same as OrderedMap?

    // if the key is not in the map, it doesn't need to be removed, so just
    // return identity
    if (!has) {
      return smap;
    }

    // if the size of the list is over certain thresholds, we make a new list
    if (list.size >= SIZE && list.size >= map.size * 2) {
      newList = list.filter((entry, idx) => entry !== undefined && i !== idx);
      newMap = newList.toKeyedSeq().map(entry => entry[0]).flip().toMap();
      if (smap.__ownerID) {
        newMap.__ownerID = newList.__ownerID = smap.__ownerID;
      }

    } else {
      newMap = map.remove(k);
      newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
    }

  } else {

    if (has) {
      // Updating already-set key means an in-place update
      // Should be same as OrderedMap
      if (v === list.get(i)[1]) {
        return smap;
      }
      newMap = map;
      newList = list.set(i, [k, v]);

    } else {
      // Set a new key and re-sort
      newList = list.push([k, v]).sortBy(([k]) => k, comparator);
      newMap = Map(list.map(([k], idx) => [k, idx]))
    }
  }
  if (smap.__ownerID) {
    smap.size = newMap.size;
    smap._map = newMap;
    smap._list = newList;
    smap._comparator = comparator;
    smap.__hash = undefined;
    return smap;
  }
  return makeSortedMap(newMap, newList, comparator);
}

export function emptySortedMap(comparator) {
  return makeSortedMap(emptyMap(), emptyList(), comparator);
}
