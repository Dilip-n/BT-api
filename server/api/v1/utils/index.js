//Utils
"use strict";
//Import nodemailer
const nodemailer = require("nodemailer");
//Import settings
const { emailSettings } = require("./../../../config/adaptor");
console.log(emailSettings);
class Utils {
  constructor() {}
  sendMail = (mailTo, mailSubject, mailText) => {
    async function main() {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: emailSettings.host,
        port: emailSettings.port,
        secure: emailSettings.secure, // true for 465, false for other ports
        auth: {
          user: emailSettings.user, // generated ethereal user
          pass: emailSettings.password, // generated ethereal password
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"BT Alert" <${emailSettings.user}`, // sender address
        to: mailTo, // list of receivers
        subject: mailSubject, // Subject line
        text: mailText, // plain text body
      });

      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    }
    main().catch(console.error);
  };
}
//Export
module.exports = Utils;
