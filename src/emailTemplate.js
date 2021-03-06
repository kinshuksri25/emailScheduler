//email template class

class EmailTemplate {
    constructor({recipientEmail = "",scheduledDate = "",emailSubject = "",emailBody = ""}){
        this.trackerNumber = Math.floor(Math.random()*1000000);
        this.recipientEmail = recipientEmail;
        this.scheduledDate = scheduledDate;
        this.emailSubject = emailSubject;
        this.emailBody = emailBody;
    }

    getEmailDetails(){
        return {
            trackerNumber : this.trackerNumber,
            recipientEmail: this.recipientEmail,
            scheduledDate: this.scheduledDate,
            emailSubject: this.emailSubject,
            emailBody: this.emailBody
        }
    }

    setEmailDetails({recipientEmail = this.recipientEmail,scheduledDate = this.scheduledDate,emailSubject = this.emailSubject,emailBody = this.emailBody}){
        this.recipientEmail = recipientEmail;
        this.scheduledDate = scheduledDate;
        this.emailSubject = emailSubject;
        this.emailBody = emailBody;
    }   
}


module.exports = EmailTemplate;