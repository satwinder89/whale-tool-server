const transactionsModel = require('../database/models/transactions')
const blockchainModel = require('../database/models/blockchain')

module.exports = {
  getSwaps: async (req, res) => {
    const offset = Number(req.query.offset)
    var gtValue = req.query.gtValue ? Number(req.query.gtValue) : 0
    if (offset == undefined || offset == null) {
      return res
        .status(400)
        .json({ message: 'FAIL', error: 'WRONG_OFFSET_FORMAT' })
    }
    let ethPrice = await blockchainModel.findOne({ name: 'Ethereum' }).lean()
    ethPrice = Number(gtValue / ethPrice.priceUSD)
    let startTime = Date.now()
    let transactions = await transactionsModel.aggregate([
      {
        $group: {
          _id: '$hash',
          count: { $sum: 1 },
          whale: { $first: '$from' },
          assetIn: { $first: '$asset' },
          addressIn: { $first: '$address' },
          assetOut: { $last: '$asset' },
          addressOut: { $last: '$address' },
          valueAssetIn: { $first: '$value' },
          valueAssetOut: { $last: '$value' },
          categories: { $push: '$category' },
          timestamp: { $first: '$date' },
        },
      },
      { $match: { categories: { $nin: ['erc721', 'erc1155', 'specialnft'] } } },
      {
        $project: {
          _id: 1,
          count: 1,
          whale: 1,
          assetIn: 1,
          addressIn: 1,
          assetOut: 1,
          addressOut: 1,
          valueAssetIn: 1,
          valueAssetOut: 1,
          categories: 1,
          timestamp: 1,
          comparisonResult: { $strcasecmp: ['$addressIn', '$addressOut'] },
        },
      },
      {
        $match: {
          $and: [
            { comparisonResult: { $ne: 0 } },
            { valueAssetIn: { $ne: null } },
            { valueAssetOut: { $ne: null } },
            { count: { $lte: 3 } },
            { count: { $gt: 1 } },
            {
              $or: [
                {
                  $and: [
                    { assetIn: { $in: ['ETH', 'WETH'] } },
                    { valueAssetIn: { $gt: ethPrice } },
                  ],
                },
                {
                  $and: [
                    { assetOut: { $in: ['ETH', 'WETH'] } },
                    { valueAssetOut: { $gt: ethPrice } },
                  ],
                },
                {
                  $and: [
                    { assetIn: { $in: ['USDT', 'USDC', 'DAI'] } },
                    { valueAssetIn: { $gt: gtValue } },
                  ],
                },
                {
                  $and: [
                    { assetOut: { $in: ['USDT', 'USDC', 'DAI'] } },
                    { valueAssetOut: { $gt: gtValue } },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'whale',
          foreignField: 'address',
          as: 'whaleName',
        },
      },
      {
        $project: {
          _id: 1,
          whale: 1,
          whaleName: '$whaleName.name',
          count: 1,
          assetIn: 1,
          addressIn: 1,
          assetOut: 1,
          addressOut: 1,
          categories: 1,
          valueAssetIn: { $toDouble: '$valueAssetIn' },
          valueAssetOut: { $toDouble: '$valueAssetOut' },
          comparisonResult: 1,
          timestamp: 1,
        },
      },
      {
        $match: {
          whaleName: { $ne: [] },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $skip: offset * 32,
      },
      {
        $limit: 32,
      },
    ])

    let countTransactions = await transactionsModel.aggregate([
      {
        $group: {
          _id: '$hash',
          count: { $sum: 1 },
          whale: { $first: '$from' },
          assetIn: { $first: '$asset' },
          addressIn: { $first: '$address' },
          assetOut: { $last: '$asset' },
          addressOut: { $last: '$address' },
          valueAssetIn: { $first: '$value' },
          valueAssetOut: { $last: '$value' },
          categories: { $push: '$category' },
          timestamp: { $first: '$date' },
        },
      },
      { $match: { categories: { $nin: ['erc721', 'erc1155', 'specialnft'] } } },
      {
        $project: {
          _id: 1,
          count: 1,
          whale: 1,
          assetIn: 1,
          addressIn: 1,
          assetOut: 1,
          addressOut: 1,
          valueAssetIn: 1,
          valueAssetOut: 1,
          categories: 1,
          timestamp: 1,
          comparisonResult: { $strcasecmp: ['$addressIn', '$addressOut'] },
        },
      },
      {
        $match: {
          $and: [
            { comparisonResult: { $ne: 0 } },
            { valueAssetIn: { $ne: null } },
            { valueAssetOut: { $ne: null } },
            { count: { $lte: 3 } },
            { count: { $gt: 1 } },
            {
              $or: [
                {
                  $and: [
                    { assetIn: { $in: ['ETH', 'WETH'] } },
                    { valueAssetIn: { $gt: ethPrice } },
                  ],
                },
                {
                  $and: [
                    { assetOut: { $in: ['ETH', 'WETH'] } },
                    { valueAssetOut: { $gt: ethPrice } },
                  ],
                },
                {
                  $and: [
                    { assetIn: { $in: ['USDT', 'USDC', 'DAI'] } },
                    { valueAssetIn: { $gt: gtValue } },
                  ],
                },
                {
                  $and: [
                    { assetOut: { $in: ['USDT', 'USDC', 'DAI'] } },
                    { valueAssetOut: { $gt: gtValue } },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'whale',
          foreignField: 'address',
          as: 'whaleName',
        },
      },
      {
        $project: {
          _id: 1,
          whale: 1,
          whaleName: '$whaleName.name',
          count: 1,
          assetIn: 1,
          addressIn: 1,
          assetOut: 1,
          addressOut: 1,
          categories: 1,
          valueAssetIn: { $toDouble: '$valueAssetIn' },
          valueAssetOut: { $toDouble: '$valueAssetOut' },
          comparisonResult: 1,
          timestamp: 1,
        },
      },
      {
        $match: {
          whaleName: { $ne: [] },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ])
    let endTime = Date.now() - startTime
    console.log('ended: ' + endTime)
    res.status(200).json({
      swaps: transactions,
      totSwaps: countTransactions[0].count,
    })
    return
  },

  getNFTs: async (req, res) => {
    try {
      const offset = Number(req.query.offset)
      if (offset == undefined || offset == null) {
        return res
          .status(400)
          .json({ message: 'FAIL', error: 'WRONG_OFFSET_FORMAT' })
      }
      let startTime = Date.now()

      const transactions = await transactionsModel.aggregate([
        {
          $group: {
            _id: '$hash',
            count: { $sum: 1 },
            whale: { $first: '$from' },
            mint: { $last: '$from' },
            assetIn: { $first: '$asset' },
            addressIn: { $first: '$address' },
            assetOut: { $last: '$asset' },
            addressOut: { $last: '$address' },
            valueAssetIn: { $first: '$value' },
            valueAssetOut: { $last: '$value' },
            categories: { $push: '$category' },
            timestamp: { $first: '$date' },
            tokenId: { $push: '$tokenId' },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            whale: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            valueAssetIn: 1,
            valueAssetOut: 1,
            categories: 1,
            timestamp: 1,
            tokenId: 1,
            comparisonResult: { $strcasecmp: ['$addressIn', '$addressOut'] },
            mint: 1,
          },
        },
        {
          $match: {
            $and: [
              { categories: { $in: ['erc721', 'erc1155', 'specialnft'] } },
              { count: { $lte: 3 } },
              { count: { $gt: 1 } },
              { comparisonResult: { $ne: 0 } },
            ],
          },
        },
        {
          $lookup: {
            from: 'wallets',
            localField: 'whale',
            foreignField: 'address',
            as: 'whaleName',
          },
        },
        {
          $match: {
            whaleName: { $ne: [] },
          },
        },
        {
          $project: {
            _id: 1,
            whale: 1,
            whaleName: '$whaleName.name',
            count: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            tokenId: 1,
            addressOut: 1,
            valueAssetIn: { $toDouble: '$valueAssetIn' },
            valueAssetOut: { $toDouble: '$valueAssetOut' },
            categories: 1,
            timestamp: 1,
            mint: 1,
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $skip: offset * 32,
        },
        {
          $limit: 32,
        },
      ])

      const countTransactions = await transactionsModel.aggregate([
        {
          $group: {
            _id: '$hash',
            count: { $sum: 1 },
            whale: { $first: '$from' },
            mint: { $last: '$from' },
            assetIn: { $first: '$asset' },
            addressIn: { $first: '$address' },
            assetOut: { $last: '$asset' },
            addressOut: { $last: '$address' },
            valueAssetIn: { $first: '$value' },
            valueAssetOut: { $last: '$value' },
            categories: { $push: '$category' },
            timestamp: { $first: '$date' },
            tokenId: { $push: '$tokenId' },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            whale: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            valueAssetIn: 1,
            valueAssetOut: 1,
            categories: 1,
            timestamp: 1,
            comparisonResult: { $strcasecmp: ['$addressIn', '$addressOut'] },
            mint: 1,
          },
        },
        {
          $match: {
            $and: [
              { categories: { $in: ['erc721', 'erc1155', 'specialnft'] } },
              { count: { $lte: 3 } },
              { count: { $gt: 1 } },
              { comparisonResult: { $ne: 0 } },
            ],
          },
        },
        {
          $lookup: {
            from: 'wallets',
            localField: 'whale',
            foreignField: 'address',
            as: 'whaleName',
          },
        },
        {
          $match: {
            whaleName: { $ne: [] },
          },
        },
        {
          $project: {
            _id: 1,
            whale: 1,
            whaleName: '$whaleName.name',
            count: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            valueAssetIn: { $toDouble: '$valueAssetIn' },
            valueAssetOut: { $toDouble: '$valueAssetOut' },
            categories: 1,
            timestamp: 1,
            mint: 1,
          },
        },
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ])

      let endTime = Date.now() - startTime
      console.log('ended: ' + endTime)
      res.status(200).json({
        swaps: transactions,
        totSwaps: countTransactions[0].count,
      })
      return
    } catch (e) {
      console.log(e)
    }
  },
}
