import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { MealItemsController } from './meal-items.controller';

@Module({
  providers: [MealsService],
  controllers: [MealsController, MealItemsController],
  exports: [MealsService],
})
export class MealsModule {}
