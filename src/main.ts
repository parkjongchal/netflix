import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('코드팩토리 넷플릭스')
    .setDescription('코드팩토리 NestJS 강의')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의 되지 않은 값들은 전달이 되지 않는다.
      forbidNonWhitelisted: true, // 정의 되지 않은 값이 들어오면 에러가 난다.
      transformOptions: {
        enableImplicitConversion: true, // 입력되는 클래스 타입을 기반으로 데이터를 변경.
      },
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
