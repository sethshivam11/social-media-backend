import mongoose from "mongoose"
import { DB_NAME } from "../constants"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,)
        console.log(`\nMongoDB Connected Successfully || ${connectionInstance.connection.host}`)
    } catch (err) {
        console.log(`\nMONGODB !!!! Connection Error\n${err}`)
        process.exit(1)
    }
}

export default connectDB