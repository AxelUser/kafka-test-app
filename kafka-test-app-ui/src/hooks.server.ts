import { connect } from "$lib/kafka";

connect().then(() => {
    console.log("Connected to Kafka.");
}).catch((error) => {
    console.error("Error connecting to Kafka:", error);
});