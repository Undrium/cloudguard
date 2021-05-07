import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';


async function bootstrap() {
  // Default the logger to warn and error, configuration is loading logging verbosity some rows below
  const app = await NestFactory.create(AppModule, {logger: ['error', 'warn']});
  
  const config = app.get("ConfigService").internalConfig;
  app.useLogger(config.logging.logLevels);
  var logger = await app.resolve("LoggerService");
  logger.setContext("Main");
  logger.demo();


  app.enableCors();
  app.setGlobalPrefix('api/v1');
  // Swagger
  const options = new DocumentBuilder()
    .setTitle('CloudGuard API')
    .setDescription('All useful endpoints')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();

