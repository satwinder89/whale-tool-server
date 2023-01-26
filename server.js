require('dotenv').config()
const database = require("./database/connectDB")

const addressBalances = require('./ethereum/addressBalances')

const runMain = async () => {
  try {
    await database.connectDB();
    // let test0 = await addressBalances.updateWallet()
    // let test = await addressBalances.accountToken()
    let test = await addressBalances.test()
    console.log(test)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()
