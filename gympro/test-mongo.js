const { MongoClient } = require('mongodb');

// URI provided by the user
const uri = "mongodb+srv://maxiplataformas_db_user:meWrBft8bEvbQLwW@cluster0.blcypj2.mongodb.net/gympro?retryWrites=true&w=majority&appName=Cluster0&tlsAllowInvalidCertificates=true";

const client = new MongoClient(uri);

async function run() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await client.connect();
        console.log("Connected successfully to server");

        const db = client.db("gympro");
        const testCollection = db.collection("test_connection");

        // Insert a test document to force database creation
        const result = await testCollection.insertOne({
            timestamp: new Date(),
            message: "Hello from GymPro local test script!"
        });

        console.log(`Document inserted with _id: ${result.insertedId}`);
        console.log("✅ The 'gympro' database has been successfully created in MongoDB Atlas.");

    } catch (err) {
        console.error("❌ Connection failed!");
        console.error(err);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
