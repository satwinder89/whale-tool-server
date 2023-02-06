const mongoose = require('mongoose')
const Schema = mongoose.Schema

const transactionConfig = {
  hash: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  asset: {
    type: String,
  },
  value: {
    type: Number,
  },
  type: {
    type: String,
    required: true,
  },
  date: {
    type: Number,
    required: true,
  },
}

let transactions = new Schema(transactionConfig, {
  collection: 'transactions',
  versionKey: false,
  strict: false,
})

transactions.index({ hash: 1, from: 1, to: 1, date: 1}, { unique: true })
transactions.index({ date: -1 })

module.exports = mongoose.model('transactions', transactions)
