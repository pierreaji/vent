const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name!']
    },
    email: {
        type: String,
        required: [true, 'Please add a email!'],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email!'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password!'],
        minLength: [6, 'Password must have min 6 Characters!'],
        maxLength: [23, 'Password not be more than 23 Characters!'],
    },
    photos: {
        type: String,
        required: [true, 'Please add a photo!'],
        default: 'https://i.ibb.co/4pDNDk1/avatar.png'
    },
    phone: {
        type: String,
        default: '+628'
    },
    bio: {
        type: String,
        default: 'Insert Bio',
        maxLength: [250, 'Password not be more than 23 Characters!']
    }
},
{
    timestamps:true,
}
)

const User = mongoose.model("User", userSchema)
module.exports = User