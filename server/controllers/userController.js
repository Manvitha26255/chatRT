const router = require('express').Router();
const User = require('./../models/user');
const authMiddleware = require('./../middlewares/authMiddleware');
const message =require('../models/message');
const cloudinary =require('./../cloudinary');
const user = require('./../models/user');


// Get details of currently logged in user
router.get('/get-logged-user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({_id: req.userId})
    res.send({
      message: 'User fetched successfully',
      success: true,
      data: user
    });
  } catch(error) {
    res.status(400).send({
      message: error.message,
      success: false
    })
  }
});
router.get('/get-all-users', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const allUsers  = await User.find({_id:{$ne: userId}});
    res.send({
      message: ' All Users fetched successfully',
      success: true,
      data: allUsers
    });
  } catch(error) {
    res.status(400).send({
      message: error.message,
      success: false
    })
  }
});

/*router.post('/upload-profile-pic',authMiddleware,async (req , res) =>{
  try {
    //const image = req.body.image?.toString();

    const image =req.body.image;

    //UPLOAD TO CLOUDINARY
    const uploadedImage = await cloudinary.uploader.upload(image, { folder: 'QuickChat' });


    //UPDATE THE USER MODEL AND SET THE PROFILE PIC
    const user = await User.findByIdAndUpdate(
      {_id: req.body.userId},
      { profilePic: uploadedImage.secure_url},
      {new: true}
    );
    res.send({
      message: 'Profile picture uploaded successfully',
      success: true,
      data: user
    })
    
  } catch (error) {
    res.send({
      message: error.message,
      success: false
    })
    
  }
})*/
router.post("/upload-profile-pic", authMiddleware, async (req, res) => {
  try {
    const image = req.body.image;
    if (!image) {
      return res.status(400).send({
        message: "No image found in request body",
        success: false,
      });
    }

    // upload to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(image, {
      folder: "QuickChat",
    });

    // update user profilePic using userId from token
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profilePic: uploadedImage.secure_url },
      { new: true }
    );

    res.send({
      message: "Profile picture uploaded successfully",
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
      success: false,
    });
  }
});

module.exports = router;



