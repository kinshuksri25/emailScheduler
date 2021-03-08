//file for scheduling and updating emails

//Dependencies
const CronJob = require('cron').CronJob;
const mongo =  require('./data');
const redisClass = require('./redis');
const domainHandler = require('./domainHandler');
const {EMSG,DBCONST} = require("./constants");
const auth = require("./google_api");

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
        let trackerNumbers = [];
        
        let currentDate = new Date();
        currentDate.setSeconds(0);
        for(let itemProperty in response){
            if(new Date(response[itemProperty]) == currentDate){
                trackerNumbers.push(parseInt(itemProperty));
            }
        }
        mongo.read(DBCONST.emailCollection,{"trackerNumber": {$in :[...trackerNumbers]}},{})
        .then(response => {
            for(const item of response){
                if(item.scheduledDate == Date()){
                    auth.tokenGeneration()
                    .then(response => {
                       return auth.sendEmail(response.access_token,item);
                    })
                    .then(response =>{
                        domainHandler.deleteEntry({"trackerNumber":item.trackerNumber});
                    })
                    .catch(response =>{
                        console.log(response);
                    });
                }
            }
        })
        .catch(response => {
            console.log(response);
        });

    }).catch(response => {
        console.log(response);
    });
}

//Function for updating missed or failed email schedules
scheduler.updateDateFunc = () =>{
    redisClass.getAllData()
    .then(response =>{
        let currentDate = new Date();
        currentDate.setSeconds(0);

        for(let itemProperty in response){
            const itemDate = new Date(response[itemProperty]);
            if(itemDate < currentDate){
                let updatedDate = itemDate;
                updatedDate.setDate(currentDate.getDate() + 1);
                domainHandler.updateEntry({trackerNumber:parseInt(itemProperty),scheduledDate:updatedDate});
            }
        }
    }).catch(response => {
        console.log(response);
    });

}

//Function for initially populating the redis cache
scheduler.populateCache = () =>{
    redisClass.dropCache()
    .then(response => {
        return mongo.read(DBCONST.emailCollection,{},{projection:{trackerNumber : 1,scheduledDate : 1,_id : 0}});
    }).then(response =>{
        for(let item of response){
            redisClass.addData(item.trackerNumber,item.scheduledDate);
        }
    })
    .catch(response =>{
        console.log(response);
    });
}

//Cron for sending scheduled emails(runs every min)
scheduler.sendEmail = () => {
    return new CronJob('* * * * *', scheduler.sendEmailFunc);
}

//Cron for updating schedules for missed or failed emails(runs every day at midnight)
scheduler.updateDate = () =>{
    return new CronJob('0 0 * * *',scheduler.updateDateFunc);
}  


//export the module
module.exports = {...scheduler};
