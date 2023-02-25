let nodemailer = require("nodemailer");
function sendmail(to,subject,body)
{
    const transporter = nodemailer.createTransport({
    port: 465, // true for 465, false for other ports
    host: "smtp.gmail.com",
    auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
    },
    secure: true,
});

const mailOptions = {
    from: "noreply.electronicsmartapp@gmail.com", // sender address
    to:to, // list of receivers
    subject:subject,
    text:body,
};

transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
});
}
module.exports = sendmail;