const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;
require('dotenv').config()

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid email address.');
      }
    },
  },
  password: {
    type: String,
    minlength: 8,
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
});

UserSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  return userObject
}

UserSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
  user.tokens = [];
  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token
}

UserSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })

  if (!user) {
    throw new Error('Unable to login')
  }

  const isMatch = password == user.password

  if (!isMatch) {
    throw new Error('Unable to login')
  }

  return user
}

UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const userExist = await User.findOne({ email: this.email })
      if (userExist) {
        return next(new RequestError('A user with this email already exists', 400))
      }

      await mongoose.model('Followers').create({ user: this._id });
      await mongoose.model('Following').create({ user: this._id });

    } catch (error) {
      return next(error.statusCode = 400);
    }
  }
})


const User = mongoose.model('User', UserSchema);
module.exports = User;