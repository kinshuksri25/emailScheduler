// This file is the central domain logic handler file

//dependencies
const mongo = require("./data");
const EmailTemplate = require("./emailTemplate");
const {EMSG,SMSG,DBCONST,SINGLE} = require("./constants");
const redisClass = require("./redis");

//object definition
let domainHandler = {};

//Function for creating a new scheduled email entry
//params --> recipientEmail(STRING),scheduledDate(STRING),emailSubject(STRING),emailBody(STRING)
//returns -- Promise
domainHandler.createEntry = ({recipientEmail = null,scheduledDate = null,emailSubject = null,emailBody = null}) => new Promise((resolve,reject)=>{

    if((recipientEmail && recipientEmail != "") 
        && (scheduledDate && scheduledDate != "") 
            && (emailSubject && emailSubject != "") 
                && (emailBody && emailBody != "")){
        if(new Date(scheduledDate) != "Invalid Date"){
            let date = new Date(scheduledDate);
            date.setSeconds(0);
            const scheduledEmail = new EmailTemplate({recipientEmail,scheduledDate:date,emailSubject,emailBody});
            mongo.insert(DBCONST.emailCollection,{...scheduledEmail.getEmailDetails()},{}).then(response =>{
                return redisClass.addData(scheduledEmail.getEmailDetails().trackerNumber,scheduledEmail.getEmailDetails().scheduledDate);
            }).then(response => {
                resolve(`${SMSG.SAVE_SUCCESS} with trackerNumber: ${scheduledEmail.getEmailDetails().trackerNumber}`);
            }).catch(response =>{
                if(response == EMSG.SVR_UTL_RDSCRERR || EMSG.SVR_UTL_RDSINCERR){
                    domainHandler.deleteEntry({trackerNumber});
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
//params --> trackerNumber (STRING)
//returns -- Promise
domainHandler.deleteEntry = ({trackerNumber = null}) => new Promise((resolve,reject) =>{
    if(trackerNumber!=null && trackerNumber != ""){
        mongo.delete(DBCONST.emailCollection,{trackerNumber : trackerNumber},{},SINGLE)
            .then( response =>{
                if(response.deletedCount == 0){
                    resolve(SMSG.DEL_SUCCESSINV);
                }
                return redisClass.deleteData(trackerNumber);
            }).then(response => {
                resolve(SMSG.DEL_SUCCESS);
            }).catch(response =>{
                reject(`${EMSG.DEL_ERROR} ${response}`);
        })
    }else{
        reject(EMSG.INVALID_ARGS_DEL);
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
        &&(args.hasOwnProperty("trackerNumber"))){

        if(args.hasOwnProperty("scheduledDate") && new Date(args.scheduledDate) == "Invalid Date"){ 
            reject(EMSG.INVALID_DATE_PATTERN);         
        }

        let set = {};
        let updateQuery = {};
        let date = "";

        if(args.hasOwnProperty("recipientEmail")){
            set.recipientEmail = args.recipientEmail;
        }
        if(args.hasOwnProperty("scheduledDate")){
            date = new Date(args.scheduledDate);
            date.setSeconds(0);
            set.scheduledDate = date;
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

        mongo.update(DBCONST.emailCollection,{"trackerNumber":args.trackerNumber},{...updateQuery},{},SINGLE)
        .then(response => {
            if(args.hasOwnProperty("scheduledDate")){
                return redisClass.updateData(args.trackerNumber,date);
            }
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
        let currentDate = new Date();
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
