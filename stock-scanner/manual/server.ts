const express = require("express")
const server = express()
server.all("/", (req: any, res: any) => {
  console.log("#> Bot is running")
  res.send("#> Bot is running!")
})
export default function keepAlive() {
  server.listen(3000, () => {
    console.log("#> Server is ready.")
  })
}