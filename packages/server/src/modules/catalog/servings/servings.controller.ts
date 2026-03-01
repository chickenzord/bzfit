import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { CreateServingDto, UpdateServingDto } from './dto';
import { ServingsService } from './servings.service';
import { createZodDto } from 'nestjs-zod';
import { NutritionImportRequestSchema } from '@bzfit/shared';

class NutritionImportRequestBody extends createZodDto(NutritionImportRequestSchema) {}

@ApiTags('catalog')
@Controller('catalog/servings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServingsController {
  constructor(private servingsService: ServingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new serving' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The serving has been successfully created.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Food not found' })
  async create(@Body() createServingDto: CreateServingDto) {
    const { foodId } = createServingDto;
    return this.servingsService.createServing(foodId, createServingDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing serving' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The serving has been successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Serving not found' })
  async update(@Param('id') id: string, @Body() updateServingDto: UpdateServingDto) {
    return this.servingsService.updateServing(id, updateServingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a serving' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The serving has been successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Serving not found' })
  async remove(@Param('id') id: string) {
    return this.servingsService.removeServing(id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Mark serving as verified, optionally updating nutrition data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The serving has been verified and updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Serving not found' })
  async verify(@Param('id') id: string, @Body() updateServingDto?: UpdateServingDto) {
    return this.servingsService.verifyServing(id, updateServingDto);
  }

  @Post(':id/nutrition-import')
  @ApiOperation({ summary: 'Fetch nutrition candidates from an external provider (does not modify the serving)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Nutrition import results from the provider' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Serving not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Provider is not configured or unavailable' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'No nutrition providers are configured' })
  async nutritionImport(
    @Param('id') id: string,
    @Body() body: NutritionImportRequestBody,
  ) {
    return this.servingsService.importNutrition(id, body.provider, body.extraContext);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get meal item count for a serving' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Number of meal items referencing this serving', schema: { type: 'object', properties: { mealItemCount: { type: 'number' } } } })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Serving not found' })
  async getMealItemCount(@Param('id') id: string) {
    return this.servingsService.getMealItemCount(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get serving by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Serving details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Serving not found' })
  async findOne(@Param('id') id: string) {
    return this.servingsService.findOne(id);
  }
}
