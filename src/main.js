import fs from 'fs';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const BOOK_SRC = path.dirname(__dirname) + '/book_src/';
const BOOK_NAME = 'es6_book';
const BOOK_TABLE = 'es6';

const db = low(new FileSync(path.dirname(__dirname) + '/db/db.json'));

export default function() {
    initdb();
    handleSidebar();
    db.get(BOOK_TABLE).value().forEach(item => {
        if(item.flag === 'content') {
            console.log(handleMdFile(item.path));
        }
    });
}

function initdb() {
    if(db.has(BOOK_NAME).value()) {
        console.log(`旧${BOOK_NAME}数据:`);
        console.log(db.get(BOOK_NAME).value());
    }
    if(db.has(BOOK_TABLE).value()) {
        console.log(`旧${BOOK_TABLE}数据:`);
        console.log(db.get(BOOK_TABLE).value());
    }
    db.set(BOOK_NAME, new Map()).write();
    db.set(BOOK_TABLE, []).write();
    db.get(BOOK_NAME).set('table', BOOK_TABLE).write();
}

function handleSidebar() {
    let sidebarFile = 'sidebar.md';
    var body = fs.readFileSync(BOOK_SRC + sidebarFile, {encoding: 'utf8', flag: 'r'});
    let items = body.match(/^(?:\d\.|[*+-])\s+\[.*\]\(.*\)$/ugm);
    let datas = [];
    items.forEach(item => {
        let dataItem = {
            flag: 'quote',
            label: '',
            path: '',
            index: '1',
        };
 
        dataItem.label = item.match(/^(?:\d\.|[*+-])\s+\[(.*)\]\(.*\)$/u)[1];
        let path = item.match(/^(?:\d\.|[*+-])\s+\[.*\]\((.*)\)$/u)[1];
        if(/^\d\./.test(item)) {
            dataItem.flag = 'content';
        }
        else {
            dataItem.flag= 'quote';
        }

        if(/^#/.test(path)) {
            dataItem.path = path.substr(1) + '.md';
        }
        else {
            dataItem.path = path;
        }

        datas.push(dataItem);
        db.get(BOOK_TABLE).push(...datas).write();

        console.log(`${sidebarFile}文件处理完成`);
    });
}

function handleMdFile(path) {
    var body = fs.readFileSync(BOOK_SRC + path, {encoding: 'utf8', flag: 'r'});
    let datas = [];
    let items = body.match(/^#\s.*$/ugm);
    if(items) {
        items.forEach(item => {
            datas.push({
                flag: 'content',
                label: item.match(/^#\s(.*)$/u)[1],
                path: '',
                index: '1',
            });
        });
    }
    items = body.match(/^##\s.*$/ugm);
    if(items) {
        items.forEach(item => {
            datas.push({
                flag: 'content',
                label: item.match(/^##\s(.*)$/u)[1],
                path: '',
                index: '2',
            });
        });
    }

    console.log(`${path}文件处理完成`);
    return datas;
}
