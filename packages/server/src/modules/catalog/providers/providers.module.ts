import { Module } from '@nestjs/common';
import { DATA_PROVIDERS, DataProvider } from './data-provider.interface';
import { DataProviderRegistry } from './data-provider.registry';
import { ProvidersController } from './providers.controller';
import { OpenFoodFactsProvider } from './implementations/open-food-facts.provider';
import { OpenAiProvider } from './implementations/openai.provider';

@Module({
  controllers: [ProvidersController],
  providers: [
    OpenFoodFactsProvider,
    OpenAiProvider,
    // add new provider classes here ↑
    {
      provide: DATA_PROVIDERS,
      useFactory: (...providers: DataProvider[]) => providers,
      inject: [
        OpenFoodFactsProvider,
        OpenAiProvider,
        // mirror the inject list when adding providers ↑
      ],
    },
    DataProviderRegistry,
  ],
  exports: [DataProviderRegistry],
})
export class ProvidersModule {}
