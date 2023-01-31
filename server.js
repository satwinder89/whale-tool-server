require('dotenv').config()
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const database = require("./database/connectDB")
const scheduler = require("./crons/scheduler")

const test = require("./ethereum/test")
const ethereum = require('./ethereum/addressBalances')

const runMain = async () => {
  try {
    await database.connectDB();
    // scheduler.syncTransactions();
    await ethereum.webhook()


    console.log("all is ok")
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

runMain() 