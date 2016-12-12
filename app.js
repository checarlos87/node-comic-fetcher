const async = require('async')
const express = require('express')
const feed = require('feed-read')
const http = require('http')
const nunjucks = require('nunjucks')

const app = express()
nunjucks.configure('views', { 
    autoescape: true,
    express: app
})

app.use(express.static('public'))

app.get('/', (req, res, next) => {

    var context = {}

    async.parallel({

        // xkcd
        xkcd: (callback) => {
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
                    return callback(error)
                }
        
                response.setEncoding('utf8')
        
                var rawData = ''
                response.on('data', (chunk) => {
                    rawData += chunk
                })
        
                response.on('end', () => {
                    try {
                        return callback(null, JSON.parse(rawData).img)
                    }
                    catch (e) {
                        console.log(e.message)
                        callback(e)
                    }
                })
        
            }).on('error', (e) => {
                console.log(`HTTP GET of xkcd JSON failed: ${e.message}`)
                callback(e)
            })

        },

        // Whomp!
        whomp: (callback) => {
            feed('http://www.whompcomic.com/rss.php', (err, articles) => {
                if (err) {
                    console.log('Error retrieving Whomp RSS: ' + err.message)
                    return callback(err)
                }
        
                callback(null, articles[0].content
                    .replace('comicsthumbs', 'comics')
                    .replace(/<br \/>.*/, '')
                    .replace(/$/, '</a>'))
            })
        },

        // Twogag
        twogag: (callback) => {
            feed('http://feeds.feedburner.com/TwoGuysAndGuy', (err, articles) => {
                if (err) {
                    console.log('Error retrieving Twogag RSS: ' + err.message)
                    return callback(err)
                }

                callback(null, articles[0].content
                    .replace(/http:\/\/www\.twogag\.com\/comics-rss/, 'http://www.twogag.com/comics'))
            })
        }

    }, // async.parallel tasks

    (err, results) => {

        if (err) {
            console.log('Error in async.parallel:', err.message)
            next(err)
        }

        context['xkcd_latest'] = results['xkcd']
        context['whomp_latest'] = results['whomp']
        context['twogag_latest'] = results['twogag']

        res.render('index.html', context)
    }) // async.parallel

}) // app.get('/')

app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500).send('Something went wrong!')
})

app.listen(8001)











