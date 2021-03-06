//Entry file for node servers

const express = require("express");
const bodyParser = require("body-parser");
const domainHandler = require("./src/domainHandler");
const scheduler = require("./src/scheduler");

const app = express();
app.use(bodyParser.json());

//GET route for listing emails
app.get('/api/readEmailList',(req,res)=>{
    domainHandler.readEntries()
    .then(response =>{
        res.json(response);
    }).catch(response => {
        res.send(response);
    });
});

//POST route for adding a new email schedule
app.post('/api/addEntry',(req,res)=>{
    domainHandler.createEntry({...req.body})
    .then(response =>{
        res.send(response);
    })
    .catch(response =>{
        res.send(response);
    });
});

//PUT route for updating an existing entry
app.put('/api/updateEntry',(req,res)=>{
    domainHandler.updateEntry({...req.body})
    .then(response =>{
        res.send(response);
    })
    .catch(response =>{
        res.send(response);
    });
});

//DELETE route for deleting an existing entry
app.delete('/api/deleteEntry',(req,res)=>{
    domainHandler.deleteEntry({...req.body})
    .then(response =>{
        res.send(response);
    })
    .catch(response =>{
        res.send(response);
    });
});

app.listen(3000,()=>{

    scheduler.populateCache();
    scheduler.updateDate();
    scheduler.startJobs();

    console.log(`App starting at http://localhost:3000/`);
});