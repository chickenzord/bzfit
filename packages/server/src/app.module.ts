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
        exclude: ['/api/{*path}'],
        serveStaticOptions: {
          setHeaders: (res: any, filePath: string) => {
            if (/\.ttf$/i.test(filePath)) res.setHeader('Content-Type', 'font/ttf');
            else if (/\.otf$/i.test(filePath)) res.setHeader('Content-Type', 'font/otf');
            else if (/\.woff$/i.test(filePath)) res.setHeader('Content-Type', 'font/woff');
            else if (/\.woff2$/i.test(filePath)) res.setHeader('Content-Type', 'font/woff2');
          },
        },
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
