const sgMail = require('@sendgrid/mail')
// const sendGridAPIKey = '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'
// sgMail.setApiKey(sendGridAPIKey)
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
console.log(process.env.SENDGRID_API_KEY)

const returnApi = () => {
    return process.env.SENDGRID_API_KEY
}



// sgMail.send({
//     to: 'yvonne881881@yahoo.com.sg',
//     from: 'yvonne881881@yahoo.com.sg',
//     subject: 'First creation',
//     text: 'You will succesfully finish this tutorial!'
// })

module.exports = returnApi