const puppeteer = require('puppeteer');
const fs = require('fs');

exports.main_handler = async (event, context, callback) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        ]
    });
    const page = await browser.newPage();
    await page.goto('https://example.com');  // 跳转至 example.com 网址
    await page.screenshot({path: '/tmp/example.png',fullPage: true});
    
    // 获取页面title可供参考
    // const title = await page.title();
    // console.log(title);

    // 点击页面属性可供参考
    // await page.click('a');
    await browser.close();
    let file = fs.readFileSync('/tmp/example.png')
    console.log(file.toString('base64')); 
    return event
};