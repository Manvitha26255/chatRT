const cloudinary = require('cloudinary');
//const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
    cloud_name: 'dcjjtbvti', 
    api_key: '446617828348218', 
    api_secret: 'C8Hs7mn2k69ILwSziNSrD8bb-GU'
  });

  module.exports = cloudinary;