import { Module } from '@nestjs/common';
import { MealsModule } from './meals/meals.module';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [MealsModule, GoalsModule],
  exports: [MealsModule, GoalsModule],
})
export class NutritionModule {}
