// This file is the central domain logic handler file

//dependencies
const mongo = require("./data");
const EmailTemplate = require("./emailTemplate");
const {EMSG,SMSG,DBCONST,SINGLE} = require("./constants");
const redisClass = require("./redis");
const { update } = require("./data");

//object definition
let domainHandler = {};

//Function for creating a new scheduled email entry
//params --> recipientEmail(STRING),scheduledDate(STRING),emailSubject(STRING),emailBody(STRING)
//returns -- Promise
domainHandler.createEntry = ({recipientEmail = null,scheduledDate = null,emailSubject = null,emailBody = null}) => new Promise((resolve,reject)=>{

    if(recipientEmail && scheduledDate && emailSubject && emailBody){
        if(new Date(scheduledDate) != "Invalid Date"){
            let date = new Date(scheduledDate);
            date.setSeconds(0);
            const scheduledEmail = new EmailTemplate({recipientEmail,scheduledDate:date,emailSubject,emailBody});
            mongo.insert(DBCONST.emailCollection,{...scheduledEmail.getEmailDetails()},{}).then(response =>{
                return redisClass.addData(scheduledEmail.getEmailDetails().recipientEmail,scheduledEmail.getEmailDetails().scheduledDate);
            }).then(response => {
                resolve(SMSG.SAVE_SUCCESS);
            }).catch(response =>{
                if(response == EMSG.SVR_UTL_RDSCRERR || EMSG.SVR_UTL_RDSINCERR){
                    domainHandler.deleteEntry({recipientEmail,scheduledDate});
                }
                reject(`${EMSG.SAVE_ERROR} ${response}`);
            });
        }else{
            reject(EMSG.INVALID_DATE_PATTERN);
        }
    }else{
        reject(EMSG.INVALID_ARGS_SAVE);
    }
});

//Function for delete a scheduled email entry
//params --> recipientEmail(STRING),scheduledDate(STRING)
//returns -- Promise
domainHandler.deleteEntry = ({recipientEmail= null,scheduledDate= null}) => new Promise((resolve,reject) =>{

    if(recipientEmail && scheduledDate){
        if(new Date(scheduledDate) != "Invalid Date"){
            let date = new Data(scheduledDate);
            date.setSeconds(0);
            const scheduledEmail = new EmailTemplate({recipientEmail,scheduledDate:date});
            mongo.delete(DBCONST.emailCollection,{$and: [ { recipientEmail: recipientEmail }, { scheduledDate: scheduledEmail } ]},{})
            .then( response =>{
                return redisClass.deleteData(scheduledEmail.getEmailDetails().recipientEmail);
            }).then(response => {
                resolve(SMSG.DEL_SUCCESS);
            }).catch(response =>{
                reject(`${EMSG.DEL_ERROR} ${response}`);
            })
        }else{
            reject(EMSG.INVALID_DATE_PATTERN);
        }
    }else{
        reject(EMSG.INVALID_ARGS_DEL);
    }

});

//Function to update Date for a scheduled email entry
//params --> recipientEmail(STRING),scheduledDate(DATE),updatedScheduledDate(DATE)
//returns -- Promise
domainHandler.updateEntryDate = ({recipientEmail = null, scheduledDate = null, updatedScheduledDate = null}) => new Promise((resolve,reject) =>{
    
    if(recipientEmail && scheduledDate && updatedScheduledDate){
        mongo.update(DBCONST.emailCollection,{$and: [ { recipientEmail: recipientEmail }, { scheduledDate: scheduledEmail } ]},{$set:{scheduledDate: updatedScheduledDate}},{returnOriginal: false},SINGLE)
        .then(response => {
            return redisClass.updateData(recipientEmail,updatedScheduledDate);
        }).then(response =>{
            resolve(SMSG.UPTD_SUCCESS);
        }).catch(response => {
            reject(`${EMSG.UPTD_ERROR} ${response}`);
        });
    }else{
        reject(EMSG.INVALID_ARGS_UPTDT);
    }

});

//Function to update Email entry
//params --> args(OBJECT) 
//returns -- Promise
domainHandler.updateEntry = (args) => new Promise ((resolve,reject) =>{

    if((args.hasOwnProperty("recipientEmail") 
        || args.hasOwnProperty("scheduledDate") 
        || args.hasOwnProperty("emailSubject") 
        || args.hasOwnProperty("emailBody"))
        &&(args.hasOwnProperty("recipientEmailSearch") && args.hasOwnProperty("scheduledDateSearch"))){

        let set = {};
        let updateQuery = {};

        if(args.hasOwnProperty("recipientEmail")){
            set.recipientEmail = args.recipientEmail;
        }
        if(args.hasOwnProperty("scheduledDate")){
            set.scheduledDate = args.scheduledDate;
        }
        if(args.hasOwnProperty("emailSubject")){
            set.emailSubject = args.emailSubject;
        }
        if(args.hasOwnProperty("emailBody")){
            set.emailBody = args.emailBody;
        }
        if(JSON.stringify(set)!=JSON.stringify({})){
            updateQuery["$set"] = {...set};
        } 

        mongo.update(DBCONST.emailCollection,{$and: [ { recipientEmail: recipientEmailSearch }, { scheduledDate: scheduledDateSearch } ]},{...updateQuery},{},SINGLE)
        .then(response => {
            if(args.hasOwnProperty("scheduledDate") || args.hasOwnProperty("recipientEmail")){
                let cacheKey = args.hasOwnProperty("recipientEmail") ? args.recipientEmail : args.recipientEmailSearch;
                let cacheVal = args.hasOwnProperty("scheduledDate") ? args.scheduledDate : args.scheduledDateSearch;

                if(args.hasOwnProperty("recipientEmail")){
                    return redisClass.deleteData(args.recipientEmailSearch);
                }else{
                    redisClass.updateData(cacheKey,cacheVal).then(response => {
                        resolve(SMSG.UPT_SUCCESS);
                    });
                }
            }
        }).then(response =>{
            return redisClass.addData(cacheKey,cacheVal);
        }).then(response =>{
            resolve(SMSG.UPT_SUCCESS);
        }).catch(response => {
            reject(`${EMSG.UPT_ERROR} ${response}`);
        });
    }else{
        reject(EMSG.INVALID_ARGS_UPT);
    }

});

//Function to list all entries
//params --> none
//returns-- Promise
domainHandler.readEntries = () => new Promise((resolve,reject) => {
    mongo.read(DBCONST.emailCollection,{},{})
    .then(responseSet => {
        let emailList = {
            "unsentEmails":[],
            "failedEmails":[],
            "currentlySendingEmails":[]
        };
        let currentDate = Date();
        currentDate.setSeconds(0);
        for(const item of responseSet){
            if(item.scheduledDate > currentDate){
                emailList.unsentEmails.push(item);
            }else if(item.scheduledDate < currentDate){
                emailList.failedEmails.push(item);
            }else{
                emailList.currentlySendingEmails.push(item);
            }
        }
        resolve(emailList);
    }).catch(response => {
        reject(`${EMSG.READ_ERROR} ${response}`);
    });
});

//export the module
module.exports = domainHandler;
