import mongoose, { Schema, model, } from "mongoose";
import { hash } from "bcrypt";
// Define the schema
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
}, {
    timestamps: true,
});
// Define a pre-save middleware to hash the password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    try {
        this.password = await hash(this.password, 10);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Define the User model
const User = mongoose.models.User || model("User", userSchema);
export default User;
