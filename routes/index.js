var express = require('express');
var router = express.Router();
const usermodel= require("./users");
const postmodel= require("./post");
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(usermodel.authenticate()))
// const upload = require("./multer")
// const sharp = require("sharp");
// const fs = require("fs");
// const path = require("path");
const { upload, upload2 } = require("./multer");



// const compressAndDelete = async (req, res, next) => {
//   try {
//     // Check if a file is present
//     if (!req.file) {
//       return res.status(400).send('No file uploaded.');
//     }

//     const originalFilePath = req.file.path;
//     const tempFilePath = path.join(path.dirname(originalFilePath), 'temp_' + path.basename(originalFilePath));

//     // Compress the image using sharp
//     await sharp(originalFilePath)
//       .resize({ width: 800, height: 800, fit: 'inside' })
//       .toFile(tempFilePath);

//     // Asynchronously unlink (delete) the original file
//     fs.unlink(originalFilePath, (unlinkError) => {
//       if (unlinkError) {
//         console.error(unlinkError);
//         return res.status(500).send('Error deleting the original file');
//       }

//       // Rename the temporary file to the original file path
//       fs.rename(tempFilePath, originalFilePath, (renameError) => {
//         if (renameError) {
//           console.error(renameError);
//           return res.status(500).send('Error renaming the temporary file');
//         }

//         next();
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// };



function isloggedin (req,res,next){
  if(req.isAuthenticated()){
    return next()
  }
  else{
    res.redirect("/login")
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('main');
});

router.get('/profile', isloggedin, async function(req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user}).populate("posts")
  const firstLetter = user.username.charAt(0).toUpperCase();
  res.render('profile',{user,firstLetter});
});

router.get('/feed', isloggedin, async function(req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})
  const post = await postmodel.find().populate("user")
  const firstLetter = user.username.charAt(0).toUpperCase();
  res.render('feed',{firstLetter,post,user});
});

router.get('/create', isloggedin, async function(req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})
  const firstLetter = user.username.charAt(0).toUpperCase();
  res.render('create',{firstLetter,user});
});

router.get('/login', function(req, res, next) {
  // console.log(req.flash("error"))
  res.render('login',{error:req.flash("error")});
});
router.get('/signup', function(req, res, next) {
  res.render('signup');
});

router.post('/register', function (req, res, next) {
  const userdets = new usermodel({
    email: req.body.email,
    username: req.body.username,
    fullname: req.body.fullname,
    // password: req.body.password,
    // picture: req.body.picture,
  })

  usermodel.register(userdets, req.body.password)
    .then(function (user) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile")
      })
    })

});

router.post('/login',passport.authenticate("local",
{successRedirect:"/feed",
failureRedirect:"/login",
failureFlash:true
})
,function(req, res, next) {
});


router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.post('/upload',isloggedin,upload.single('image'),async function (req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})
  user.profilepicture = req.file.filename,
  await user.save()
  res.redirect('/profile');
});


router.post('/createpost',isloggedin,upload2.single('postimage'),async function (req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})
  const post = await postmodel.create({
    user:user._id,
    title:req.body.title,
    description:req.body.description,
    postimage:req.file.filename
  })
  user.posts.push(post._id)
  await user.save()
  res.redirect("/profile")
});



router.get('/edit',isloggedin, async function (req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})
  const firstLetter = user.username.charAt(0).toUpperCase();
  res.render('edit',{firstLetter,user});
});


router.post('/editprofile',isloggedin, upload.single('updateprofile'),async function (req, res, next) {
  let user = await usermodel.findOneAndUpdate({username:req.session.passport.user},{username:req.body.username ,bio:req.body.bio,fullname:req.body.fullname},{new:true})
  console.log(req.file)
  if(req.file){
    user.profilepicture = req.file.filename
  }
  await user.save()
  res.redirect("/profile")
});



router.get('/search/:username',isloggedin, async function (req, res, next) {
const regex = new RegExp(`^${req.params.username}`,'i')  
const user = await usermodel.find({username:regex})
res.json(user)
});


router.get('/postprofile/:postid',isloggedin, async function (req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})
  const firstLetter = user.username.charAt(0).toUpperCase();
  let poster = await usermodel.findOne({_id:req.params.postid}).populate("posts")
  res.render("postprofile",{poster,user,firstLetter,error:req.flash("error")})
});


router.post('/search', isloggedin, async function (req, res, next) {
  try {
    const regex = new RegExp(`^${req.body.username}`, 'i');
    const users = await usermodel.find({ username: regex });
    res.json(users);
  } catch (error) {
    console.error("Error in search route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// router.get('/fullpost/:postid',isloggedin, async function (req, res, next) {
//   let user = await usermodel.findOne({username:req.session.passport.user})
//   let post = await postmodel.findOne({_id:req.params.postid}).populate("user")
//   const firstLetter = user.username.charAt(0).toUpperCase();
//   res.render('fullpost',{firstLetter,user,post});
// });



router.get('/fullpost/:postid', isloggedin, async function (req, res, next) {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    const post = await postmodel.findOne({ _id: req.params.postid })
      .populate('user')
      .populate({
        path: 'comments',
        populate: { path: 'user' } // Populate the user field in the comments array
      });
console.log(post)
    const firstLetter = user.username.charAt(0).toUpperCase();
    console.log(user._id)

    res.render('fullpost', { firstLetter, user, post });
  } catch (error) {
    // Handle error appropriately (e.g., log it or show an error page)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/likes/:postid', isloggedin, async function (req, res, next) {
    // Your existing code to fetch user and post
    let user = await usermodel.findOne({ username: req.session.passport.user });
    let post = await postmodel.findOne({ _id: req.params.postid })
    const firstLetter = user.username.charAt(0).toUpperCase();
    if(post.likes.indexOf(user._id) === -1){
      post.likes.push(user._id)
    }
    else{
      post.likes.splice(post.likes.indexOf(user._id), 1)
    }
   await post.save()
   
    // Assuming you want to redirect to the fullpost page for the liked post
    res.redirect(`/fullpost/${req.params.postid}`);
});


router.get('/comment/:postid', isloggedin, async function (req, res, next) {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    const post = await postmodel.findOne({ _id: req.params.postid });

    // Assuming your form has an input field with the name "comment"
    const commentText = req.query.comment;

    // Create a new comment
    const newComment = {
      user: user._id,
      comment: commentText,
    };

    // Add the comment to the post's comments array
    post.comments.push(newComment);

    // Save the updated post
    await post.save();

    // Redirect to the full post page
    res.redirect(`/fullpost/${req.params.postid}`);
  } catch (error) {
    // Handle error appropriately (e.g., log it or show an error page)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
// Route to follow a user
// router.get('/follow/:userId', async (req, res) => {
//   try {
//     const currentUser = await usermodel.findOne({ username: req.session.passport.user });
//     const userToFollow = await usermodel.findById(req.params.userId);

//     // Check if the user is trying to follow themselves
//     if (currentUser._id.equals(userToFollow._id)) {
//       return res.status(400).send('Cannot follow yourself.');
//       failureFlash:true
//     }

//     // Check if the user is not already following the target user
//     if (!currentUser.following.includes(req.params.userId)) {
//       currentUser.following.push(req.params.userId);
//       userToFollow.followers.push(currentUser._id);

//       await currentUser.save();
//       await userToFollow.save();

//       res.redirect(`/postprofile/${req.params.userId}`);
//     } else {
//       res.status(400).send('You are already following this user.');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });
router.get('/follow/:userId', async (req, res) => {
  try {
    const currentUser = await usermodel.findOne({ username: req.session.passport.user });
    const userToFollow = await usermodel.findById(req.params.userId);

    // Check if the user is trying to follow themselves
    if (currentUser._id.equals(userToFollow._id)) {
      req.flash('error', 'Cannot follow yourself.');
      return res.redirect(`/postprofile/${req.params.userId}`);
    }

    // Check if the user is not already following the target user
    if (!currentUser.following.includes(req.params.userId)) {
      currentUser.following.push(req.params.userId);
      userToFollow.followers.push(currentUser._id);

      await currentUser.save();
      await userToFollow.save();

      res.redirect(`/postprofile/${req.params.userId}`);
    } else {
      req.flash('error', 'You are already following this user.');
      res.redirect(`/postprofile/${req.params.userId}`);
    }
  } catch (error) {
    console.error(error);
    req.flash('error', 'Internal Server Error');
    res.redirect(`/postprofile/${req.params.userId}`);
  }
});





// router.get('/unfollow/:userId', async (req, res) => {
//   try {
//     const currentUser = await usermodel.findOne({ username: req.session.passport.user });
//     const userToUnfollow = await usermodel.findById(req.params.userId);

//     // Check if the user is trying to unfollow themselves
//     if (currentUser._id.equals(userToUnfollow._id)) {
//       return res.status(400).send('Cannot unfollow yourself.');
//     }

//     // Check if the user is following the target user
//     if (currentUser.following.includes(req.params.userId)) {
//       currentUser.following.pull(req.params.userId);
//       userToUnfollow.followers.pull(currentUser._id);

//       await currentUser.save();
//       await userToUnfollow.save();

//       res.redirect(`/postprofile/${req.params.userId}`);
//     } else {
//       res.status(400).send('You are not following this user.');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });


router.get('/unfollow/:userId', async (req, res) => {
  try {
    const currentUser = await usermodel.findOne({ username: req.session.passport.user });
    const userToUnfollow = await usermodel.findById(req.params.userId);

    // Check if the user is trying to unfollow themselves
    if (currentUser._id.equals(userToUnfollow._id)) {
      req.flash('error', 'Cannot unfollow yourself.');
      return res.redirect(`/postprofile/${req.params.userId}`);
    }

    // Check if the user is following the target user
    if (currentUser.following.includes(req.params.userId)) {
      currentUser.following.pull(req.params.userId);
      userToUnfollow.followers.pull(currentUser._id);

      await currentUser.save();
      await userToUnfollow.save();

      res.redirect(`/postprofile/${req.params.userId}`);
    } else {
      req.flash('error', 'You are not following this user.');
      res.redirect(`/postprofile/${req.params.userId}`);
    }
  } catch (error) {
    console.error(error);
    req.flash('error', 'Internal Server Error');
    res.redirect(`/postprofile/${req.params.userId}`);
  }
});
module.exports = router;
