import fs from 'fs';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const BOOK_PATH = path.dirname(__dirname) + '/book/';
const BOOK_SRC_PATH = path.dirname(__dirname) + '/book_src/';
const BOOK_NAME = 'es6_book';
const SIDEBAR_FILE_PATH = BOOK_SRC_PATH + 'sidebar.md';
const CHAPTER_PREFIX = 'docs/chapter';

const db = low(new FileSync(path.dirname(__dirname) + '/db/db.json'));

export default function() {
    initdb();

    db.get(BOOK_NAME)
        .set('bookJson', handleBookJson())
        .write();
    let bookSummary = handleSidebar();
    bookSummary.body
        .forEach((item, index) => {
            item.children = handleMdFile(item.path);
            item.label = `第${ index + 1 }章 ${ item.label }`;
            item.path = `${ CHAPTER_PREFIX }${ index + 1 }/README.md`;
        });

    db.get(BOOK_NAME)
        .set('bookSummary', bookSummary)
        .write();

    createSummaryFile(bookSummary);

    bookSummary.body
        .forEach(item => {
            if (item.needReadmeFile) {
                createReadmeFile(item);
            }
        });
}

function initdb() {
    if (db.has(BOOK_NAME).value()) {
        console.log(`旧${ BOOK_NAME }数据:`);
        console.log(db.get(BOOK_NAME).value());
    }

    db.set(BOOK_NAME, new Map()).write();
}

function handleBookJson() {
    return {
        "root": "./book",
        "title": "ECMAScript 6 入门（2017-12-22）",
        "description": "《ECMAScript 6 入门》是一本开源的 JavaScript 语言教程，全面介绍 ECMAScript 6 新引入的语法特性。",
        "author": "阮一峰",
        "language": "zh-hans",
        "structure": {
            "readme": "README.md",
            "summary": "SUMMARY.md"
        },
        "styles": {
            "website": "css/app.css",
            "mobi": "css/app.css",
            "epub": "css/app.css"
        }
    };
}

function handleSidebar() {
    let body = fs.readFileSync(SIDEBAR_FILE_PATH, {encoding: 'utf8', flag: 'r'});
    let items = body.match(/^(?:\d\.|[*+-])\s+\[.*\]\(.*\)$/ugm);
    let book = {
        objective: [],
        body: [],
        other: [],
    };

    items.forEach(item => {
        let dataItem = {
            label: '',
            path: '',
            index: '1',
        };

        dataItem.label = item.match(/^(?:\d\.|[*+-])\s+\[(.*)\]\(.*\)$/u)[1];
        let path = item.match(/^(?:\d\.|[*+-])\s+\[.*\]\((.*)\)$/u)[1];

        if (/^#/.test(path)) {
            dataItem.path = path.substr(1) + '.md';
            dataItem.needReadmeFile = !/readme\.md$/i.test(path);
            if(/^#readme$/i.test(path)) {
                book.objective.push(dataItem);
            }
            else {
                book.body.push(dataItem);
            }
        }
        else {
            dataItem.path = path;
            book.other.push(dataItem);
        }
    });

    console.log(`${ path.basename(SIDEBAR_FILE_PATH) }文件处理完成`);
    return book;
}

function handleMdFile(path) {
    let body = fs.readFileSync(BOOK_SRC_PATH + path, {encoding: 'utf8', flag: 'r'});
    body = body.replace(/^```(?:.|\r|\n)*?^```$/ugm, '');
    let datas = [];
    let items = body.match(/^##\s.*$/ugm);
    if (items) {
        items.forEach(item => {
            datas.push({
                flag: 'content',
                label: item.match(/^##\s(.*)$/u)[1],
                path: path + '#' + item.match(/^##\s(.*)$/u)[1],
                index: '2',
            });
        });
    }

    console.log(`${ path }文件处理完成`);
    return datas;
}

function checkAndMkdir(filePath) {
    if (!fs.existsSync(filePath)) {
        checkAndMkdir(path.dirname(filePath));
        fs.mkdirSync(filePath);
    }
}

function createSummaryFile(list) {
    let summaryPath = 'SUMMARY.md';
    checkAndMkdir(BOOK_PATH);
    let fd = fs.openSync(BOOK_PATH + summaryPath, 'w');
    fs.writeSync(fd, '# 目录\n', 'utf8');
    list.objective.forEach(item => {
        fs.writeSync(fd, `* [${ item.label }](${ item.path })\n`, 'utf8');
    });

    fs.writeSync(fd, '\n## 正文\n', 'utf8');
    list.body.forEach(item => {
        fs.writeSync(fd, `* [${ item.label }](${ item.path })\n`, 'utf8');
        if(item.children) {
            item.children.forEach((child, index) => {
                fs.writeSync(fd, `    * [${ index + 1 }. ${ child.label }](${ child.path })\n`, 'utf8');
            });
        }
    });

    fs.writeSync(fd, '\n## 其他\n', 'utf8');
    list.other.forEach(item => {
        fs.writeSync(fd, `* [${ item.label }](${ item.path })\n`, 'utf8');
    });

    fs.closeSync(fd);
    console.log(`生成${ summaryPath }文件完成`);
}

function createReadmeFile(info) {
    checkAndMkdir(path.dirname(BOOK_PATH + info.path));
    let fd = fs.openSync(BOOK_PATH + info.path, 'w');
    fs.writeSync(fd, `# ${ info.label }\n\n`, 'utf8');
    if (info.children) {
        info.children.forEach((item, index) => {
            fs.writeSync(fd, `${ index + 1 }. [${ item.label }](../${ item.path.replace('docs/', '') })\n`, 'utf8');
        });
    }
    fs.closeSync(fd);
    console.log(`生成${ info.path }文件完成`);
}
