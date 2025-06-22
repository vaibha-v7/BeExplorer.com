const mongoose = require('mongoose');
const Review = require('./review');

const listingSchema = mongoose.Schema({
    title: {
        type:String,
        required:true
    },
    description:String,
    image: {
        
        url:{
            type: String,
            filename: {
                type:String,
                default:"lolo"
            }
            
        }

    },
    price: Number,
    location: String,
    country : String,
    review: [
        {

            type : mongoose.Schema.Types.ObjectId,
            ref: "Review"
            
        }
    ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
})

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing.review.length){
        const res = await Review.deleteMany({_id:{$in:listing.review}});
        console.log(res);
    }
})


const Listing = mongoose.model('Listing',listingSchema);

module.exports=Listing;