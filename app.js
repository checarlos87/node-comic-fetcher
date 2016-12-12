const express = require('express')
const http = require('http')
const nunjucks = require('nunjucks')

const app = express()
nunjucks.configure('views', { 
    autoescape: true,
    express: app
})

app.get('/', (req, res) => {

    http.get('http://xkcd.com/info.0.json', (response) => {

        var statusCode = response.statusCode
        var contentType = response.headers['content-type']

        let error
        if (statusCode !== 200)
            error = new Error(`Error: ${statusCode}`)

        else if (!/^application\/json/.test(contentType))
            error = new Error(`Expected content-type application/json, ` +
                `got ${contentType} instead.`)

        if (error) {
            console.log(error.message)
            response.resume()
            return
        }

        response.setEncoding('utf8')

        var rawData = ''
        response.on('data', (chunk) => {
            rawData += chunk
        })

        response.on('end', () => {
            try {
               var context = {
                   xkcd_latest: JSON.parse(rawData).img
               }
               res.render('index.html', context)
            }
            catch (e) {
                console.log(e.message)
            }
        })
    })
}).on('error', (e) => {
    console.log(`HTTP GET of xkcd JSON failed: ${e.message}`)
})

app.listen(8001)
