import { Module, forwardRef } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { MealItemsController } from './meal-items.controller';
import { GoalsModule } from '../goals/goals.module';
import { CatalogModule } from '../../catalog/catalog.module';

@Module({
  imports: [forwardRef(() => GoalsModule), CatalogModule],
  providers: [MealsService],
  controllers: [MealsController, MealItemsController],
  exports: [MealsService],
})
export class MealsModule {}
