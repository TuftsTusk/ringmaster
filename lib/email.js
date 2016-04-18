mailer = require('nodemailer');
var Consts = require('./consts.js');
var mailOpts = {
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
        user: Consts.utilEmailAddress,
        pass: Consts.utilEmailPassword
    }
};
var transporter = mailer.createTransport(mailOpts);

exports.sendConfirmationEmail = function(host, email, confirmation, userid, cb) {
  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"Admin" <admin@tuskmarketplace.com>', // sender address
      to: email, // list of receivers
      subject: 'Welcome to Tusk Marketplace', // Subject line
      text: confirmation, // plaintext body
      html: '<a href='+host+'/user/'+userid+'?key='+confirmation+'>Click to Confirm your Account</b>' // html body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return cb(error);
      }
      else {
        return cb(false);
      }
  });
}
