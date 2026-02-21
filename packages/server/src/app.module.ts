import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ServerModule } from './modules/server/server.module';
import { AppController } from './app.controller';

const staticModules = process.env.SERVE_STATIC_PATH
  ? [
      ServeStaticModule.forRoot({
        rootPath: process.env.SERVE_STATIC_PATH,
        exclude: ['/api/(.*)'],
      }),
    ]
  : [];

@Module({
  imports: [
    ...staticModules,
    PrismaModule,
    ServerModule,
    AuthModule,
    CatalogModule,
    NutritionModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
