// testConnection();
import mongoose from 'mongoose';

const dbUrl = 'mongodb+srv://yoanha:1ndviMii9reQBkqX@cluster0.omfxmcn.mongodb.net/';

mongoose.connect(dbUrl)
    .then(() => {
        console.info("Connected to the DB");
    })
    .catch((e) => {
        console.log("Error: ", e);
    });
