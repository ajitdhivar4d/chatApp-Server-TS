import multer from "multer";
// Configure multer with file size limits
const multerUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB file size limit
    },
});
// Define a single file upload handler for 'avatar' field
const singleAvatar = multerUpload.single("avatar");
// Define an array file upload handler for 'files' field, allowing up to 5 files
const attachmentsMulter = multerUpload.array("files", 5);
export { singleAvatar, attachmentsMulter };
