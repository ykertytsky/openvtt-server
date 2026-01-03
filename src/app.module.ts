import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { WorldModule } from './worlds/world.module';
import { StorageModule } from './storage/storage.module';
import { AssetsModule } from './assets/assets.module';

@Module({
  imports: [AuthModule, WorldModule, StorageModule, AssetsModule],
  controllers: [AppController],
})
export class AppModule {}
