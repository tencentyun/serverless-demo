"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setBaseViewsDir(path_1.join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');
    await app.listen(9000, '0.0.0.0', () => {
        console.log(`Server start on http://0.0.0.0:9000`);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map