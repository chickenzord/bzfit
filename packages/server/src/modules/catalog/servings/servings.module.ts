import { Module } from '@nestjs/common';
import { ServingsController } from './servings.controller';
import { ServingsService } from './servings.service';
import { FoodsModule } from '../foods/foods.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [PrismaModule, FoodsModule, ProvidersModule],
  controllers: [ServingsController],
  providers: [ServingsService],
  exports: [ServingsService],
})
export class ServingsModule {}
