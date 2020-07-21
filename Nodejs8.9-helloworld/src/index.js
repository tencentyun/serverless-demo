'use strict';
exports.main_handler = async (event, context, callback) => {
    console.log("Hello World")
    console.log(event)
    console.log(event["non-exist"])
    console.log(context)
    return event
};