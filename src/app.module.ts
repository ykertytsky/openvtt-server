import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { WorldModule } from './worlds/world.module';

@Module({
  imports: [AuthModule, WorldModule],
  controllers: [AppController],
})
export class AppModule {}
