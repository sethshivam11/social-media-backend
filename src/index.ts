import connectDB from "./db";
import httpServer from "./app";

const port = process.env.PORT || 5000;

connectDB()
  .then(() =>
    httpServer.listen(port, () => console.log(`App is running on port ${port}`))
  )
  .catch((err) => console.log(`\nMongoDB Connection Error !!!! \n${err}`));
