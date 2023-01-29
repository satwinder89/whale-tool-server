require('dotenv').config()
const database = require("./database/connectDB")

const scheduler = require("./crons/scheduler")

const runMain = async () => {
  try {
    await database.connectDB();
    scheduler.syncTransactions();
    console.log("all is ok")
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()