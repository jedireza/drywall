var siteConfig = require('./siteConfig');

exports.port = process.env.PORT || siteConfig.port || 3000;
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || siteConfig.mongo_uri
};
exports.companyName = siteConfig.company;
exports.projectName = siteConfig.project;
exports.systemEmail = siteConfig.projectEmail;
exports.cryptoKey = siteConfig.cookieSecret;
exports.loginAttempts = {
  forIp: 50,
  forIpAndUser: 7,
  logExpiration: '20m'
};
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
    address: process.env.SMTP_FROM_ADDRESS || siteConfig.projectEmail
  },
  credentials: {
    user: process.env.SMTP_USERNAME || siteConfig.projectEmail,
    password: process.env.SMTP_PASSWORD || siteConfig.smtp_password,
    host: process.env.SMTP_HOST || siteConfig.smtp_host,
    ssl: true
  }
};
exports.oauth = {
  twitter: {
    key: process.env.TWITTER_OAUTH_KEY || '',
    secret: process.env.TWITTER_OAUTH_SECRET || ''
  },
  facebook: {
    key: process.env.FACEBOOK_OAUTH_KEY || '',
    secret: process.env.FACEBOOK_OAUTH_SECRET || ''
  },
  github: {
    key: process.env.GITHUB_OAUTH_KEY || '',
    secret: process.env.GITHUB_OAUTH_SECRET || ''
  }
};
