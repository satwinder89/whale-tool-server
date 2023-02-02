const Web3 = require('web3')

// const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8551`))
// console.log(web3.eth.accounts)

var self = {}

self.test = async function () {
//   const Web3 = require('web3')
  const web3 = new Web3('http://localhost:8551')

  web3.eth.getBlockNumber().then(console.log)
  //   var myAddr = '0x9dda370f43567b9c757a3f946705567bce482c42'
  //   var currentBlock = await web3.eth.getBlockNumber()

  //   var n = web3.eth.getTransactionCount(myAddr, currentBlock)
  //   var bal = web3.eth.getBalance(myAddr, currentBlock)
  //   for (var i = currentBlock; i >= 0 && (n > 0 || bal > 0); --i) {
  //     try {
  //       var block = eth.getBlock(i, true)
  //       if (block && block.transactions) {
  //         {
  //           block.transactions.forEach(function (e) {
  //             if (myAddr == e.from) {
  //               if (e.from != e.to) {
  //                 bal = bal.plus(e.value)
  //                 console.log(i, e.from, e.to, e.value.toString(10))
  //                 --n
  //               }
  //               if ((myAddr = e.to)) {
  //                 if (e.from != e.to) bal = bal.minus(e.value)
  //                 console.log(i, e.from, e.to, e.value.toString(10))
  //               }
  //             }
  //           })
  //         }
  //       }
  //     } catch (e) {
  //       console.error('Error for block ' + i, e)
  //     }
  //   }
}

module.exports = self
