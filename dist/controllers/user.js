import { TryCatch } from "../middlewares/error.js";
import User from "../models/user.js";
import { fileToBuffer } from "../utils/bufferConversion.js";
import { sendToken, uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
// Create a new user and save it to the database and save token in cookie
export const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
    const file = req.file;
    if (!file)
        return next(new ErrorHandler("Please Upload Avatar", 400));
    // Convert file to buffer
    const bufferFile = await fileToBuffer(file);
    // Upload file to Cloudinary
    const result = await uploadFilesToCloudinary([bufferFile]);
    const avatar = {
        public_id: result[0].public_id,
        url: result[0].url,
    };
    // Create the user and ensure proper typing
    const userDoc = await User.create({
        name,
        bio,
        username,
        password,
        avatar,
    });
    // Since userDoc is of type Document, we need to assert its type to IUser
    const user = userDoc.toObject();
    sendToken(res, user, 201, "User created");
});
