const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require("../models/listing.js");

// console.log(initData.data);


const MONGO_URI = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URI)
}
main().then((res)=>{
    console.log("connection success full");
    
}).catch((err)=>{
    console.log(err);
    
})

const initDB = async ()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj,owner:'68481ac68b639636fde45e0e'}))
    await Listing.insertMany(initData.data)
    .then((res)=>{
        console.log(res);
        
    }).catch((err)=>{
        console.log(err);
        
    })
}

initDB();




