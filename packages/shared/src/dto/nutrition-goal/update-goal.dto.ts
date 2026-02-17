import { PartialType } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';

/**
 * All fields are optional for PATCH updates
 */
export class UpdateGoalDto extends PartialType(CreateGoalDto) {}
