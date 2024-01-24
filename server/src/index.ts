import connectDB from "./db"
import app from "./app"
import "dotenv/config"




connectDB()
    .then(() => app.listen(process.env.PORT, () => console.log(`App is running on port ${process.env.port}`)))
    .catch((err) => console.log(`\nMongoDB Connection Error !!!! \n${err}`))