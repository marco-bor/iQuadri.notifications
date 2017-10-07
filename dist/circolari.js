let fs = require('fs')
let fsPath = require('fs-path')
let request = require('request')


const hashDir = __dirname + '/../circolariHash.txt'
const utf8 = "utf-8"
let hash
let code_hash

fs.readFile(hashDir, { encoding: utf8 }, async (err, data) => {
    if (data)
        hash = data.toString()
    try {
        code_hash = await getCodeAndHash(hash)
        if (code_hash[0] == 200) {
            fsPath.removeSync(hashDir)
            fsPath.writeFileSync(hashDir, code_hash[1], utf8)
            log("Hash updated: " + hash + " -> " + code_hash[1])
            request.post("https://fcm.googleapis.com/fcm/send", {
                json: true,
                body: {
                    to: "/topics/android_14",
                    priority: "high",
                    data: {
                        title: "",
                        body: "",
                        action: "circolari"
                    }
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'key=' + process.env.KEY
                }
            }, (err, response, body) => {
                if (response.statusCode == 200) log("Notification Sent")
                process.exit()
            })
        } else {
            process.exit()
        }
    } catch (err) {
        throw err
    }

})

function getCodeAndHash(foundHash) {
    return new Promise((resolve, reject) => {
        request.head("https://mail.liceoquadri.it/wp_circolari/wordpress/index.php/category/circolari/feed",
            foundHash ? { headers: { "If-None-Match": foundHash } } : {},
            (err, res, body) => {
                if (err) reject(err)
                else resolve([res.statusCode, res.headers.etag])
            }
        )
    })
}

function log(s) {
    console.log('[' + new Date().toUTCString() + '] ' + s.toString())
}
