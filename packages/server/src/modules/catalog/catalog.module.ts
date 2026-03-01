import { Module } from '@nestjs/common';
import { FoodsModule } from './foods/foods.module';
import { ServingsModule } from './servings/servings.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [FoodsModule, ServingsModule, ProvidersModule],
  exports: [FoodsModule, ServingsModule, ProvidersModule],
})
export class CatalogModule {}
