import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CatalogModule,
    NutritionModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
