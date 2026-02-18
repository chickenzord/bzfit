import { Module } from '@nestjs/common';
import { ServingsController } from './servings.controller';
import { ServingsService } from './servings.service';
import { FoodsModule } from '../foods/foods.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, FoodsModule], // FoodsModule is still needed for Food entity checks when creating servings
  controllers: [ServingsController],
  providers: [ServingsService],
  exports: [ServingsService],
})
export class ServingsModule {}
