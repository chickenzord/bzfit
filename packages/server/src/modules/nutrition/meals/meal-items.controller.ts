import { Controller, Patch, Delete, Param, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../../auth/guards';
import { UpdateMealItemDto } from './dto';

@ApiTags('nutrition')
@Controller('nutrition/meal-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MealItemsController {
  constructor(private mealsService: MealsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update meal item (quantity, notes)' })
  @ApiBody({ type: UpdateMealItemDto })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Meal item not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateItemDto: UpdateMealItemDto,
  ) {
    return this.mealsService.updateItem(req.user.id, id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete meal item (auto-deletes meal if no items remain)' })
  @ApiResponse({ status: 204, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meal item not found' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.mealsService.deleteItem(req.user.id, id);
  }
}
