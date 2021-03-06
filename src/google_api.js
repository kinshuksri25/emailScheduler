//file for interacting with the google apis

//Dependencies
const nodemailer = require("nodemailer");
const https = require("https");
const url = require('url');
const stringdecoder = require('string_decoder').StringDecoder;
const {EMSG,SMSG,email} = require('./constants');

const decoder = new stringdecoder('utf-8');

//object definition
const auth = {};

//Function for sending email
auth.sendEmail = (accessToken,item) => new Promise((resolve,reject) => {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: "OAuth2",
            user: email.senderEmail,
            clientId: email.clientID,
            clientSecret: email.clientSecret,
            refreshToken: email.refreshToken,
            accessToken: accessToken
    }});
    
    let mailOptions = {
        from: email.senderEmail,
        to: item.recipientEmail,
        subject: item.emailSubject,
        text: item.emailBody
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            reject(EMSG.EMAILERROR);
        } else {
            resolve(SMSG.EMAILSUCCESS);
            console.log('Email sent: ' + info.response);
        }
    }); 
});

//Function for generating access_token
auth.tokenGeneration = () => new Promise((resolve,reject) => {

    
    let parsedUrl = url.parse(email.refreshTokenURL);
    let requestDetails = {
        'host': parsedUrl.host,
        'hostname': parsedUrl.hostname,
        'protocol' : parsedUrl.protocol,
        'method' : 'POST',
        'Content-Type': 'application/x-www-form-urlencoded',
        'path': parsedUrl.path,
        'pathname': parsedUrl.pathname,
        'href': parsedUrl.href
    };
    
    let data = {
        client_id : email.clientID,
        client_secret : email.clientSecret,
        refresh_token : email.refreshToken,
        grant_type : "refresh_token"
    };
    
    //https request
    let accessTokenReq = https.request(requestDetails, function(response) {

        let responseString = '';

        response.on('data', function(chunk) {
            responseString += decoder.write(chunk);
        });

        response.on('end', function() {
            responseString += decoder.end();
            responseString = JSON.parse(responseString);
            resolve(responseString);
        });
    });
    
        accessTokenReq.write(JSON.stringify(data));

        //error checking
        accessTokenReq.on('error', (error) => {
            console.log(error);
            reject(EMSG.SVR_OAUTH_CONNERR);
        });

        //send request
        accessTokenReq.end();
});

//exporting the module
module.exports = auth;