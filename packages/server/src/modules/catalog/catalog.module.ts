import { Module } from '@nestjs/common';
import { FoodsModule } from './foods/foods.module';
import { ServingsModule } from './servings/servings.module';

@Module({
  imports: [FoodsModule, ServingsModule],
  exports: [FoodsModule, ServingsModule],
})
export class CatalogModule {}
