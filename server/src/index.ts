import connectDB from "./db"
import app from "./app"



connectDB()
    .then(() => app.listen(process.env.PORT, () => console.log(`App is running on port ${process.env.PORT}`)))
    .catch((err) => console.log(`\nMongoDB Connection Error !!!! \n${err}`))