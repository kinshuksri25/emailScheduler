//constants file for the backend
const constants = {};

//DBaaS related Constants object
constants.DBCONST = {
    "DB_NAME": "emailScheduler",
    "emailCollection": "emailCollection",
    "password" : "testaccount"
};

constants.dbConnUrl = `mongodb+srv://admin:${constants.DBCONST.password}@emailscheduler.nnrnj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


//message structure --> server/client_location(DAO/controller)_errormsg
constants.EMSG = {
        //NOERROR
        "NOERROR" : "",       
        //DAO
        "SVR_DAO_CONNERR" : "Unable to connect to the Database, please try again",
        "SVR_DAO_RDERR" : "Unable to read data from the Database, please try again",
        "SVR_DAO_WRERR" : "Unable to write to the Database, please try again",
        "SVR_DAO_UPERR" : "Unable update the Database, please try again",
        "SVR_DAO_DLERR" : "Unable to delete data from the Database, please try again",

        //REDIS
        "SVR_UTL_RDSINCERR" : "Incomplete data provided, unable to add data to redis database",
        "SVR_UTL_RDSUNKEYERR" : "Please provided a key to search data",
        "SVR_UTL_RDSCRERR" : "Unable to add data to the redis database, please try again",
        "SVR_UTL_RDSRDERR" : "Unable to read data from redis database, please try again",
        "SVR_UTL_RDSDELERR" : "Unable to delete data from redis database, please try again",
        "SVR_UTL_RDSCLRCHERR" : "Unable to clear redis database, please try again",
        "SVR_UTL_RDSUSRERR" : "Unable to get userlist from redis database, please try again",
        
        //DOMAINERROR
        "SAVE_ERROR" : "Email scheduling was insuccessful due to the following error:",
        "INVALID_DATE_PATTERN" : "The Date format is incorrect please follow the following formats: 1995-12-17T03:24:00/December 17, 1995 03:24:00",
        "INVALID_ARGS_SAVE" : "Email scheduling was unsuccessful, following arguments are needed --> recipientEmail,scheduledDate,emailSubject,emailBody",
        "DEL_ERROR" : "Email schedule couldnot be deleted due to the following error:",
        "INVALID_ARGS_DEL" : "Email schedule deletion was unsuccessful, following arguments are needed --> trackerNumber",
        "UPTD_ERROR" : "Email schedule update failed due to the following error:",
        "INVALID_ARGS_UPTDT" : "Email schedule update failed, following arguments are needed --> trackerNumber,scheduledDate",
        "READ_ERROR" : "Failed to procure schedule list due to the following error:",
        "UPT_ERROR" : "Failed to update the email schedule due to the following error:",
        "INVALID_ARGS_UPT" : "Email details update failed, following arguments are needed --> (editable arguments --> recipientEmail,scheduledDate,emailSubject,emailBody),(required arguments --> trackerNumber)",
        "BACK_DATE" : "The provided date is earlier than the current date, please provide a date post the current date",

        //AUTHERROR
        "SVR_OAUTH_CONNERR" : "Connection to google server couldnot be established",
        "EMAILERROR" : "Unable to send the email"
};

//message structure --> server/client_location(DAO/controller)_successmsg
constants.SMSG = {
        "SAVE_SUCCESS" : "Email scheduled successfully",
        "DEL_SUCCESS" : "Email schedule deleted successfully",
        "UPTD_SUCCESS" : "Email schedule updated by one day",
        "UPT_SUCCESS" : "Email details updated successfully",
        "DEL_SUCCESSINV" : "No schedule with this tracker number is available",
        "EMAILSUCCESS" : "Email sent successfully"
};


constants.email = {
    "refreshTokenURL" : "https://oauth2.googleapis.com/token",
    "senderEmail" : "testac11112222@gmail.com",
    "clientID" : "528995776027-phgd6fq72441iunupn5ij8m6rl6q8tgv.apps.googleusercontent.com",
    "clientSecret" : "4rHkCNxM5CiUnStO3mdjP127",
    "refreshToken" : "1//04CRQM0SzR_HNCgYIARAAGAQSNwF-L9IrD70cBZqvfANEtG8LrssBGVQnSasdrp3WQFUD93DjclJctKuYEYnR3swjNy71wSu5qlA"
}

//DBaaS related constant, used for deleting or updating SINGLE or MULTIPLE values in a document
constants.SINGLE = 1;
constants.MULTIPLE = 2;

module.exports = {...constants};
