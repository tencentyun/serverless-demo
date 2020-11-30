const zlib = require('zlib');

exports.main_handler = async (event, context) => {
    const payload = Buffer.from(event.clslogs.data, 'base64');
    const parsed = JSON.parse(zlib.gunzipSync(payload).toString('utf8'));
    console.log('Decoded payload:', JSON.stringify(parsed));
    return `Successfully`;
};