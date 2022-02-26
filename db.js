const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config()

const Connect = async() => {
    try {
        await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log("Mongo DB connected")
    } catch (error) {
        console.log("Error in connecting Mongo DB", error)
    }
}

module.exports = Connect;