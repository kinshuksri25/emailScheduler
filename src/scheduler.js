//file for scheduling and updating emails

//Dependencies
const CronJob = require('cron').CronJob;
const nodemailer = require("nodemailer");
const mongo =  require('./data');
const redisClass = require('./redis');
const domainHandler = require('./domainHandler');
const {EMSG,DBCONST} = require("./constants");

//object definition
let scheduler = {};

//Function for stating crons jobs
scheduler.startJobs = () => {
    scheduler.sendEmail().start();
    scheduler.updateDate().start();
}

//Function for sending scheduled emails
scheduler.sendEmailFunc = () => {
    redisClass.getAllData().then(response =>{
        let emailCache = {};
        
        let currentDate = Date();
        currentDate.setSeconds(0);

        for(let itemProperty in response){
            if(response[itemProperty] == currentDate){
                emailCache[itemProperty] = response[itemProperty];
            }else{
                redisClass.deleteData(itemProperty);
            }
        }
        
        let recipientEmails = Object.entries(emailCache);
        let scheduledDates = Object.keys(emailCache);

        mongo.read(DBCONST.emailCollection,{$and: [ { recipientEmail: {$in: [...recipientEmails]} }, { scheduledDate: {$in : [...scheduledDates]}}]},{})
        .then(response => {
            for(const item of response){
                if(item.scheduledDate == Date()){
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                        user: 'testac11112222@gmail.com',
                        pass: 'testaccount'
                        }
                    });
                    
                    let mailOptions = {
                        from: 'testac11112222@gmail.com',
                        to: item.recipientEmail,
                        subject: item.emailSubject,
                        text: item.emailBody
                    };
                    
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            domainHandler.deleteEntry({"recipientEmail":item.recipientEmail,"scheduledDate":item.scheduledDate});
                            console.log('Email sent: ' + info.response);
                        }
                    }); 
                }
            }
        })
        .catch(response => {
            console.log(EMSG.CRN_DBREADERROR);
        });

    }).catch(response => {
        console.log(EMSG.CRN_REDISREADERROR);
    });
}

//Function for updating missed or failed email schedules
scheduler.updateDateFunc = () =>{

    redisClass.getAllData()
    .then(response =>{
        let currentDate = Date();
        currentDate.setSeconds(0);

        for(let itemProperty in response){
            if(response[itemProperty] == currentDate){
                let updatedDate = response[itemProperty];
                updatedDate.setDate(updatedDate.getDate() + 1);
                domainHandler.updateEntryDate(itemProperty,response[itemProperty],updateDate);
            }
        }
    }).catch(response => {
        console.log(EMSG.CRN_REDISREADERROR);
    });

}

//Function for initially populating the redis cache
scheduler.populateCache = () =>{
    mongo.read(DBCONST.emailCollection,{},{projection:{recipientEmail : 1,scheduledDate : 1,_id : 0}})
    .then(response =>{
        let cacheData = [...response];
        for(let item in cacheData){
            redisClass.addData(item.recipientEmail,item.scheduledDate);
        }
    })
    .catch(response =>{
        console.log(EMSG.POPCACHE);
    });
}

//Cron for sending scheduled emails
scheduler.sendEmail = () => {
    return new CronJob('* * * * *', scheduler.sendEmailFunc());
}

//Cron for updating schedules for missed or failed emails 
scheduler.updateDate = () =>{
    return new CronJob('0 0 * * *',scheduler.updateDateFunc());
}  


//export the module
module.exports = {...scheduler};