import { Request } from 'express';
import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    root(): {
        message: string;
    };
    event(request: Request): {
        event: any;
    };
}
