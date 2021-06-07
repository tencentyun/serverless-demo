import { DynamicModule } from '@nestjs/common';
import { ValueProvider } from '@nestjs/common/interfaces';
export declare class InternalCoreModule {
    static register(providers: ValueProvider[]): DynamicModule;
}
