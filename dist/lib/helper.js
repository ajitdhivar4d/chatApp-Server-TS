// Helper function to convert file to Base64 (Assuming file is a Buffer)
export const getBase64 = (file) => {
    return `data:image/jpeg;base64,${file.toString("base64")}`;
};
