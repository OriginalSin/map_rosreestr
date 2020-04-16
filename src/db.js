import { openDB } from 'idb';

const dbPromise = openDB('Cadastre', 1, {
  upgrade(db) {
    db.createObjectStore('cadastre');
  },
});

const Dbase = {
  async get(key) {
    return (await dbPromise).get('cadastre', key);
  },
  async set(key, val) {
    return (await dbPromise).put('cadastre', val, key);
  },
  async delete(key) {
    return (await dbPromise).delete('cadastre', key);
  },
  async clear() {
    return (await dbPromise).clear('cadastre');
  },
  async keys() {
    return (await dbPromise).getAllKeys('cadastre');
  },
  async values() {
    return (await dbPromise).getAll('cadastre');
  },
};

export { Dbase as default };

/*
https://github.com/jakearchibald/idb
*/
