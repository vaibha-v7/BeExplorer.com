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

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const multer = require("multer");
const { error } = require('console');


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
   

   res.send("working fine"); 
    
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



