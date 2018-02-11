import Express from 'express';
let app = new Express();
app.get('/', (req, res) => {
    res.send('Hello world!');
});

let server = app.listen(3000,function() {
   let host = server.address().address;
   let port = server.address().port;
   console.dir(server.address());
   console.log('Example app listening at http://%s:%s', host, port);
});