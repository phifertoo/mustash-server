const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
/* .env.process is a global variable that is injected at runtime. To 
add to the global variable, you must npm install dotenv and 
require("dotenv").config()*/
require("dotenv").config();

//connect mongoDB using mongoose
const connectDB = async () => {
  try {
    /* connect using the connection string in the config*/
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("MongoDB connected...");
  } catch (err) {
    console.error(err.message);
    /* exit process if failure*/
    process.exit(1);
  }
};

connectDB();

app.use(express.json({ extended: false }));

app.use("/api/users", require("./routes/api/users"));

/* Setting up the server. Proccess.env.PORT looks for environment variable called PORT.
Since the app is served by Heroku, Heroku will look in process.env.PORT to serve 
the app. If there is no environment variable it will default to 5000 (
    for local deployment) */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
