import { Module } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodsController, ServingsController } from './foods.controller';

@Module({
  providers: [FoodsService],
  controllers: [FoodsController, ServingsController],
  exports: [FoodsService],
})
export class FoodsModule {}
