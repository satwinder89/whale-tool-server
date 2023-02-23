require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5001
const database = require('./database/connectDB')
const bodyParser = require('body-parser')
const scheduler = require('./crons/scheduler')
const routes = require('./routes/routes')()
const ethereum = require('./ethereum/alchemySDK')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')
const options = require('./swagger')
const swaggerSpec = swaggerJsdoc(options)
app.use(cors())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const alchemySDK = require('./ethereum/alchemySDK')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use((req, res, next) => {
    bodyParser.json({ strict: false })(req, res, next)
})

app.use('/api', routes)

const runMain = async () => {
  try {
    await database.connectDB()
    await alchemySDK.updateWallet()
    await alchemySDK.updateTokensPrice()
    // await ethereum.blockNumber()
    // scheduler.updateEthToUSDPrice()
    // scheduler.checkTransactions()
    // scheduler.deleteOldTransactions()
    console.log('all is ok')
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})

runMain()