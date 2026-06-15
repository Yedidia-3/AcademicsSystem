import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Auth uses Bearer tokens in Authorization header (not cookies),
  // so credentials:true is not needed and breaks origin:* in browsers.
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendUrl
      ? frontendUrl.split(',').map((u) => u.trim())
      : true,  // reflect request origin in dev; set FRONTEND_URL in prod
    credentials: false,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Serve static files from frontend build
  app.useStaticAssets(join(__dirname, '../../frontend/dist'), {
    prefix: '/',
  });

  // SPA fallback: serve index.html for all non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
    } else {
      res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
    }
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Jericho API running on http://localhost:${port}`);
}

bootstrap();
