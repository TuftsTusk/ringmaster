mailer = require('nodemailer');
var Consts = require('./consts.js');
var mailOpts = {
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.UTILEMAILADDRESS,
        pass: process.env.UTILEMAILPASSWORD
    }
};
var transporter = mailer.createTransport(mailOpts);

exports.sendConfirmationEmail = function(host, email, confirmation, userid, cb) {
  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"noreply" <noreply@tuskmarketplace.com>', // sender address
      to: email, // list of receivers
      subject: 'Welcome to Tusk Marketplace', // Subject line
      text: confirmation, // plaintext body
      html: '<a href='+host+'/#/me/confirm/'+userid+'/'+confirmation + '>Click to Confirm your Account</b>' // html body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return cb("Email Confirmation Error");
      }
      else {
        return cb(false);
      }
  });
}

exports.contactSeller = function(from, to, message, cb) {
  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"noreply" <noreply@tuskmarketplace.com>', // sender address
      replyTo: from,
      to: to, // list of receivers
      subject: 'New Message on Your Item', // Subject line
      text: message // plaintext body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return cb("Email Confirmation Error");
      }
      else {
        return cb(false);
      }
  });
}

exports.sendRecoverPasswordEmail = function(host, email, confirmation, userid, cb) {
  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"noreply" <noreply@tuskmarketplace.com>', // sender address
      to: email, // list of receivers
      subject: 'Reset your Tusk Marketplace Account Password', // Subject line
      text: confirmation, // plaintext body
      html: '<a href='+host+'/#/me/recover/'+userid+'/'+confirmation + '>Click to Reset your Password</b>' // html body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return cb("Email Confirmation Error");
      }
      else {
        return cb(false);
      }
  });
}
