require('dotenv').config()

const upload = require("./upload");
const uploadToImgBB = require("./imgbb");

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const Listing= require('./models/listing.js');
var methodOverride = require('method-override');
var ejsMate = require("ejs-mate");
const wrapAsync= require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require('./models/review.js');
const Joi = require('joi');
const { reviewSchema } = require('./schema.js');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const multer = require("multer");
const { error } = require('console');

// Enable CORS for React frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser("secretkey"));
app.use(methodOverride('_method'));

const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    crypto:{
        secret: process.env.SECRET
    },
    touchAfter: 24*3600
})

store.on('error',()=>{
    console.log("error in mongo session store ",err);
})

app.use(session({
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30, //30 days
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        httpOnly: true 
    }
}))

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.engine("ejs",ejsMate);

const link = process.env.MONGO_URI;

async function main() {
    await mongoose.connect(link)
}

main().then((res)=>{
    console.log("connection success full");
    
}).catch((err)=>{
    console.log(err);
    
})

//server side validation for review - 
const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let msg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(400, msg);
    }
    else {
        next();
    }
}

//=========================================================demouser=====================================================

// app.get('/demouser',async (req,res)=>{
//     let fakeUser=new User({
//         email:"student102@gmail.com",
//         username:"student102"
//     });

//     let registeredUser=await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// })

//==============================================cheack if logged in==========================================
function isLoggedIn(req,res,next){
    console.log(req.user)
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must be Logged In");
        return res.redirect("/login");
    }
    next();
}
function saveRedirectUrl(req,res,next){
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl
    }
    next();
}

async function isReviewAutor(req,res,next){
    let {id,reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currentUser._id)){
        req.flash("error","You are not the Author");
        return res.redirect(`/listings/${id}`);
    }
    next();

}

app.get("/",(req,res)=>{    
   

   res.redirect('/listings') 
    
});

app.get("/test", (req, res) => {
    console.log(req.user);
    res.send("Check console");
});

//=========================================================listing=====================================================

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    
    next();
})

//index route
app.get("/listings", wrapAsync(async (req,res)=>{
    let allListing= await Listing.find();
    
    

    res.render("listings/index.ejs",{allListing});
}))

//

//new route
app.get("/listings/new",isLoggedIn,(req,res)=>{
    
    res.render("listings/new.ejs")
})

app.post("/listings/new", isLoggedIn, upload.single("image"), wrapAsync(async (req, res) => {
    let { title, description, price, location, country } = req.body;

    // Validate ke liye
    if (!title) throw new ExpressError(400, "Title is required");
    if (!description) throw new ExpressError(400, "Description is required");
    if (!req.file) throw new ExpressError(400, "Image is required");
    if (!price) throw new ExpressError(400, "Price is required");
    if (!location) throw new ExpressError(400, "Location is required");
    if (!country) throw new ExpressError(400, "Country is required");

    // Uploading to imgbb
    const imagePath = req.file.path;
    const imageUrl = await uploadToImgBB(imagePath);  

    let newprice = parseInt(price);
    const newplace = new Listing({
        title,
        description,
        image: { url: imageUrl },
        price: newprice,
        location,
        country,
        owner: req.user._id
    });

    await newplace.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
}));

//show route

app.get("/listings/:id", wrapAsync(  async (req,res)=>{
    let {id}=req.params;
    let place = await Listing.findById(id).populate({path:"review",populate:{
        path:"author",
    },}).populate("owner");
    if(!place){
        req.flash("error","Listing not found");
        res.redirect("/listings");
    }
    console.log(place);
    res.render("listings/show.ejs",{place});
}))

app.get("/listings/:id/edit",isLoggedIn,wrapAsync( async(req,res)=>{
    
    let {id}= req.params;

    let place = await Listing.findById(id);
    
    

    res.render("listings/edit.ejs",{place});
}))

app.patch("/listings/:id/edit", isLoggedIn, upload.single("image"), wrapAsync(async (req, res) => {
    let { id } = req.params;
    let { title, description, price, location, country } = req.body;
    let newprice = parseInt(price);

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to edit this listing");
        return res.redirect(`/listings/${id}`);
    }

    let updatedImageUrl = listing.image.url; // default no update in img

    // agr new img upload upload it to imgbb
    if (req.file) {
        updatedImageUrl = await uploadToImgBB(req.file.path);
    }

    await Listing.findByIdAndUpdate(id, {
        title,
        description,
        image: { url: updatedImageUrl },
        price: newprice,
        location,
        country
    });

    req.flash("success", "Listing updated successfully!");
    res.redirect("/listings");
}));

app.delete("/listings/:id/delete",isLoggedIn, wrapAsync( async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id)
    
    req.flash("success","Listing deleted successfully!");
    res.redirect("/listings");
}))

//=========================================================review=====================================================
//review post route
app.post("/listings/:id/review", isLoggedIn, validateReview  ,wrapAsync( async (req,res)=>{
    let {id} = req.params;

    let{rating,comment}=req.body;
    console.log('review', rating);
    console.log('comment', comment);

    let listing = await Listing.findById(id);

    let review = new Review({
        rating: rating,
        comment: comment
    });
    review.author=req.user._id;
    
    await review.save();
    listing.review.push(review);

    await listing.save();

    
    console.log(listing);
    req.flash("success","Review added successfully!");
    res.redirect(`/listings/${id}`);
    
}))

//review delete route

app.delete("/listings/:id/review/:reviewId",isLoggedIn,isReviewAutor, wrapAsync( async (req,res)=>{
    let {id,reviewId} = req.params;
    
    await Listing.findByIdAndUpdate(id,{$pull:{review:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review deleted successfully!");
    res.redirect(`/listings/${id}`);
    
}))

//=========================================================user authentication signup=====================================================
app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs")
})

app.post("/signup",  wrapAsync(async (req, res) => {
    try{

        let { username, email, password } = req.body;
        const newUser = new User({ email, username })
        const registeredUser = await User.register(newUser, password)
        console.log(registeredUser);
        req.login(registeredUser, (err)=>{
            if(err){
                return next(err)
            }

            req.flash("success","Welcome to BeExplorer")
            res.redirect("/listings")
        })
        
    }
    catch(e){
        req.flash("error",e.message)
        res.redirect("/signup");
        
    }
    
}))

//login

app.get('/login',(req,res)=>{
    res.render("users/login.ejs")
})

app.post("/login", saveRedirectUrl ,passport.authenticate("local",{failureRedirect:'/login', failureFlash:true}) ,async(req,res)=>{
    req.flash("success","Welcome back to BeExplorer");
    let redirectUrl = res.locals.redirectUrl || "/listings"
    res.redirect(redirectUrl);
})

//LOGOUT

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are Logged out!!")
        res.redirect("/listings")
    })
})

//=========================================================API ENDPOINTS FOR REACT FRONTEND=====================================================

// API endpoint to get all listings as JSON
app.get("/api/listings", wrapAsync(async (req, res) => {
    try {
        const allListings = await Listing.find().populate("owner");
        res.json({
            success: true,
            data: allListings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch listings",
            error: error.message
        });
    }
}));

// API endpoint to get single listing as JSON
app.get("/api/listings/:id", wrapAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({path: "review", populate: {path: "author"}})
            .populate("owner");
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }
        
        res.json({
            success: true,
            data: listing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch listing",
            error: error.message
        });
    }
}));

// API endpoint to add a review
app.post("/api/listings/:id/review", wrapAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        
        // Check if user is authenticated
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to add a review"
            });
        }

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        const review = new Review({
            rating: rating,
            comment: comment,
            author: req.user._id
        });
        
        await review.save();
        listing.review.push(review);
        await listing.save();

        // Populate the review with author info
        await review.populate('author');

        res.json({
            success: true,
            message: "Review added successfully",
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add review",
            error: error.message
        });
    }
}));

// API endpoint to delete a review
app.delete("/api/listings/:id/review/:reviewId", wrapAsync(async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        
        // Check if user is authenticated
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to delete a review"
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user is the author of the review
        if (!review.author.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this review"
            });
        }

        await Listing.findByIdAndUpdate(id, { $pull: { review: reviewId } });
        await Review.findByIdAndDelete(reviewId);

        res.json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
            error: error.message
        });
    }
}));

// =================== API AUTH ENDPOINTS FOR REACT FRONTEND ===================

// Signup
app.post('/api/signup', wrapAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      res.json({ success: true, user: { username: registeredUser.username, email: registeredUser.email, _id: registeredUser._id } });
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}));

// Login
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ success: true, user: { username: user.username, email: user.email, _id: user._id } });
    });
  })(req, res, next);
});

// Logout
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get current user
app.get('/api/current_user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ loggedIn: true, user: { username: req.user.username, email: req.user.email, _id: req.user._id } });
  } else {
    res.json({ loggedIn: false });
  }
});

// API endpoint to create new listing with image upload
app.post("/api/listings/new", isLoggedIn, upload.single("image"), wrapAsync(async (req, res) => {
    try {
        let { title, description, price, location, country } = req.body;

        // Validation
        if (!title) throw new ExpressError(400, "Title is required");
        if (!description) throw new ExpressError(400, "Description is required");
        if (!req.file) throw new ExpressError(400, "Image is required");
        if (!price) throw new ExpressError(400, "Price is required");
        if (!location) throw new ExpressError(400, "Location is required");
        if (!country) throw new ExpressError(400, "Country is required");

        // Upload to ImgBB
        const imagePath = req.file.path;
        const imageUrl = await uploadToImgBB(imagePath);

        let newprice = parseInt(price);
        const newListing = new Listing({
            title,
            description,
            image: { url: imageUrl },
            price: newprice,
            location,
            country,
            owner: req.user._id
        });

        await newListing.save();
        
        // Populate owner info
        await newListing.populate("owner");

        res.json({
            success: true,
            message: "New listing created successfully!",
            data: newListing
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}));

// API endpoint to update listing with image upload
app.patch("/api/listings/:id/edit", isLoggedIn, upload.single("image"), wrapAsync(async (req, res) => {
    try {
        let { id } = req.params;
        let { title, description, price, location, country } = req.body;
        let newprice = parseInt(price);

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        if (!listing.owner.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to edit this listing"
            });
        }

        let updatedImageUrl = listing.image.url;

        if (req.file) {
            updatedImageUrl = await uploadToImgBB(req.file.path);
        }

        const updatedListing = await Listing.findByIdAndUpdate(id, {
            title,
            description,
            image: { url: updatedImageUrl },
            price: newprice,
            location,
            country
        }, { new: true }).populate("owner");

        res.json({
            success: true,
            message: "Listing updated successfully!",
            data: updatedListing
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}));

// API endpoint to delete listing
app.delete("/api/listings/:id/delete", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        let { id } = req.params;
        
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        if (!listing.owner.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this listing"
            });
        }

        await Listing.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: "Listing deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete listing",
            error: error.message
        });
    }
}));

//=========================================================error handling=====================================================

app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1> <a href="/listings">Go back to home</a>');
});

app.use((err,req,res,next)=>{
    let {status=404,message="something broke"}= err;
    // res.status(status).send(message);
    res.status(status).render("error.ejs",{status,message});
})

app.listen(3000,()=>{
    console.log('server has started');
    
})



