import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const adapter = new FileSync('../db/db.json');
const db = low(adapter);

db.defaults({ books: [] })
    .write();

db.get('books')
    .push('es6')
    .write();

