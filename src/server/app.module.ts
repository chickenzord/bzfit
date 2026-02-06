import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FoodsModule } from './modules/foods/foods.module';
import { MealsModule } from './modules/meals/meals.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FoodsModule,
    MealsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
