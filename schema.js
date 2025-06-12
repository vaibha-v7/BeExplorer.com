//server side validation for review - didn't understand (copied from the internet)

const Joi = require('joi');

module.exports.reviewSchema = Joi.object({
    
    comment: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required()
    }).required()
