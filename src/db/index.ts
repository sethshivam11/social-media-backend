import mongoose from "mongoose"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME || "sociial"}`,)
        console.log(`\nMongoDB Connected Successfully || ${connectionInstance.connection.host}`)
    } catch (err) {
        console.log(`\nMONGODB !!!! Connection Error\n${err}`)
        process.exit(1)
    }
}

export default connectDB