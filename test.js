mailer = require('nodemailer');
var mailOpts = {
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
        user: 'admin@tuskmarketplace.com',
        pass: 'Tuskmarketplace'
    }
};
var transporter = mailer.createTransport(mailOpts);

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Admin" <admin@tuskmarketplace.com>', // sender address
    to: 'michael.m.seltzer@gmail.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world 🐴', // plaintext body
    html: '<b>Hello world 🐴</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});
