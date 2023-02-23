const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tokensConfig = {
    address: {
        type: String,
        required: true
    },
    name: {
        type: String,
    },
    symbol: {
        type: String,
    },
    decimals: {
        type: Number,
    },
    logo: {
        type: String,
    },
    price: {
        type: Object
    },
    lastUpdate: {
        type: Number
    }
}

let tokens = new Schema(tokensConfig, {
    collection: 'tokens',
    versionKey: false,
    strict: false,
})

tokens.index({ address: 1 })

module.exports = mongoose.model('tokens', tokens)