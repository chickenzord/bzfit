import { Module } from '@nestjs/common';
import { ServingsController } from './servings.controller';
import { FoodsModule } from '../foods/foods.module';

@Module({
  imports: [FoodsModule],
  controllers: [ServingsController],
})
export class ServingsModule {}
