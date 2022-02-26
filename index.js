const express = require('express');
const Connect = require('./db');
const apirouter = require('./routes/routes')

const app = express()

app.use(express.json());

app.use('/api', apirouter);

Connect();

const port = process.env.PORT || 5000;

app.listen(port, ()=>{
    console.log(`Server running at ${port}`);
})