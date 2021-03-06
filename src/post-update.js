const moment = require("moment")
require("./string-utilities.js")

function postToSlack(appInfo, submissionStartDate) {
    const WebClient = require("@slack/client").WebClient
    const client = new WebClient(process.env.BOT_API_TOKEN)
    const message = `The status of your app *${appInfo.name}* has been changed to *${appInfo.status.formatted()}*`
    const attachment = slackAttachment(appInfo, submissionStartDate)
    const params = {
        "attachments" : [attachment],
        "as_user" : "true"
    }
    var channel = process.env.SLACK_CHANNEL_NAME
    if (!channel) {
        channel = "#ios-app-updates"
    }
    client.chat.postMessage(channel, message, params, function(err,) {
        if (err) {
            console.log("Error:", err)
        }
    })
}

function postMessageToSlack(message) {
    const WebClient = require("@slack/client").WebClient
    const client = new WebClient(process.env.BOT_API_TOKEN)
    const params = {
        "as_user" : "true"
    }
    const channel = process.env.BOT_STATUS_SLACK_CHANNEL_NAME
    if (!channel) {
        return
    }
    client.chat.postMessage(channel, message, params, function(err,) {
        if (err) {
            console.log("Error:", err)
        }
    })
}

function slackAttachment(appInfo, submissionStartDate) {
    const attachment = {
        "fallback": `The status of your app ${appInfo.name} has been changed to ${appInfo.status.formatted()}`,
        "color": colorForStatus(appInfo.status),
        "title": "App Store Connect",
        "author_name": appInfo.name,
        "author_icon": appInfo.iconUrl,
        "title_link": `https://appstoreconnect.apple.com/apps/${appInfo.appId}/appstore`,
        "fields": [
            {
                "title": "Version",
                "value": appInfo.version,
                "short": true
            },
            {
                "title": "Status",
                "value": appInfo.status.formatted(),
                "short": true
            }
        ],
        "footer": "App Store Connect",
        "footer_icon": "https://devimages.apple.com.edgekey.net/app-store/marketing/guidelines/images/app-store-icon.png",
        "ts": new Date().getTime() / 1000
    }

    // Set elapsed time since "Waiting For Review" start
    if (submissionStartDate && appInfo.status != "PREPARE_FOR_SUBMISSION" && appInfo.status != "WAITING_FOR_REVIEW") {
        const elapsedHours = moment().diff(moment(submissionStartDate), "hours")
        // FIXME: Commented out for now until we find a reliable way to implement "Elapsed Time".
        //        Right now, if the bot reboots in-between status checks in Heroku, the "waiting for review"
        //        start time will be lost, thus making the "Elapsed Time" shorter than it actually was.
        console.log(`Here's where we'd add 'Elapsed Time' (${elapsedHours} hours) to the attachment, but this feature has been temporarily disabled.`)
        // attachment["fields"].push({
        //     "title": "Elapsed Time",
        //     "value": `${elapsedHours} hours`,
        //     "short": true
        // })
    }
    return attachment
}

function colorForStatus(status) {
    const infoColor = "#8e8e8e"
    const warningColor = "#f4f124"
    const successColor1 = "#1eb6fc"
    const successColor2 = "#14ba40"
    const failureColor = "#e0143d"
    const colorMapping = {
        "PREPARE_FOR_SUBMISSION" : infoColor,
        "WAITING_FOR_REVIEW" : successColor1,
        "IN_REVIEW" : successColor1,
        "PENDING_CONTRACT" : warningColor,
        "WAITING_FOR_EXPORT_COMPLIANCE" : warningColor,
        "PENDING_DEVELOPER_RELEASE" : successColor2,
        "PROCESSING_FOR_APP_STORE" : successColor2,
        "PENDING_APPLE_RELEASE" : successColor2,
        "READY_FOR_SALE" : successColor2,
        "REJECTED" : failureColor,
        "METADATA_REJECTED" : failureColor,
        "REMOVED_FROM_SALE" : failureColor,
        "DEVELOPER_REJECTED" : failureColor,
        "DEVELOPER_REMOVED_FROM_SALE" : failureColor,
        "INVALID_BINARY" : failureColor
    }
    return colorMapping[status]
}

module.exports = {
    slack: postToSlack,
    slackMessage: postMessageToSlack
}
