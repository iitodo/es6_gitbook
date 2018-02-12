import fs from 'fs';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const BOOK_PATH = path.dirname(__dirname) + '/book/';
const BOOK_SRC_PATH = path.dirname(__dirname) + '/book_src/';
const BOOK_NAME = 'es6_book';
const BOOK_TABLE = 'es6';
const SIDEBAR_FILE_PATH = BOOK_SRC_PATH + 'sidebar.md';
const CHAPTER_PREFIX = 'docs/chapter';

const db = low(new FileSync(path.dirname(__dirname) + '/db/db.json'));

export default function() {
    initdb();
    handleSidebar();
    let index = 1;
    db.get(BOOK_TABLE).forEach((item) => {
        if(item.flag === 'content' && !/^.*readme\.md$/ui.test(item.path)) {
            item.children = handleMdFile(item.path);
            item.label = `第${ index }章 ${ item.label }`
            item.path = CHAPTER_PREFIX + index + '/README.md';
            item.needReadmeFile = true;
            index++;
        }
    }).write();

    db.get(BOOK_TABLE).value().forEach((item, index) => {
        if(item.needReadmeFile) {
            createReadmeFile(item);
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
    let body = fs.readFileSync(SIDEBAR_FILE_PATH, {encoding: 'utf8', flag: 'r'});
    let items = body.match(/^(?:\d\.|[*+-])\s+\[.*\]\(.*\)$/ugm);
    let datas = [];
    items.forEach(item => {
        let dataItem = {
            flag: 'quote',
            label: '',
            path: '',
            index: '1',
            needReadmeFile: false,
            children: null,
        };
 
        dataItem.label = item.match(/^(?:\d\.|[*+-])\s+\[(.*)\]\(.*\)$/u)[1];
        let path = item.match(/^(?:\d\.|[*+-])\s+\[.*\]\((.*)\)$/u)[1];
        if(/^\d\./.test(item)) {
            dataItem.flag = 'content';
        }
        else {
            dataItem.flag = 'quote';
        }

        if(/^#/.test(path)) {
            dataItem.path = path.substr(1) + '.md';
        }
        else {
            dataItem.path = path;
        }

        datas.push(dataItem);
    });

    db.get(BOOK_TABLE).push(...datas).write();
    console.log(`${path.basename(SIDEBAR_FILE_PATH)}文件处理完成`);
}

function handleMdFile(path) {
    let body = fs.readFileSync(BOOK_SRC_PATH + path, {encoding: 'utf8', flag: 'r'});
    body = body.replace(/^```(?:.|\r|\n)*?^```$/ugm, '');
    let datas = []; 
    let items = body.match(/^##\s.*$/ugm);
    if(items) {
        items.forEach(item => {
            datas.push({
                flag: 'content',
                label: item.match(/^##\s(.*)$/u)[1],
                path: path + "#" + item.match(/^##\s(.*)$/u)[1],
                index: '2',
            });
        });
    }

    console.log(`${path}文件处理完成`);
    return datas;
}

function checkAndMkdir(filePath) {
    if(!fs.existsSync(filePath)) {
        checkAndMkdir(path.dirname(filePath));
        fs.mkdirSync(filePath);
    }
}

function createReadmeFile(info) {
    checkAndMkdir(path.dirname(BOOK_PATH + info.path));
    let fd = fs.openSync(BOOK_PATH + info.path, 'w');
    fs.writeSync(fd, `# ${ info.label }\n\n`, 'utf8');
    if(info.children) {
        info.children.forEach(item => {
            fs.writeSync(fd, `* [${ item.label }](${ item.path })\n`, 'utf8');
        });
    }
    fs.closeSync(fd);
    console.log(`生成${info.path}文件完成`);
}
