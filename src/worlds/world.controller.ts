import { Controller, Post, UseGuards, Body, Get, Query, Param, Delete } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WorldService } from "./world.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateWorldDto } from "./dto/createWorld.dto";
import { GetWorldsDto } from "./dto/getWords.dto";

import type { User } from "../db/schema";

@Controller('worlds')
@UseGuards(JwtAuthGuard)
export class WorldController {
    constructor(private readonly worldService: WorldService) {}

    @Post('create')
    async createWorld(@Body() createWorldDto: CreateWorldDto, @CurrentUser() user: User) {
        return this.worldService.createWorld(createWorldDto, user.id);
    }

    @Get('get-worlds')
    async getWorlds(@Query() query: GetWorldsDto, @CurrentUser() user: User) {
        return this.worldService.getWorlds(user.id, query);
    }

    @Delete(':id')
    async deleteWorld(@Param('id') id: string, @CurrentUser() user: User) {
        return this.worldService.deleteWorld(id, user.id);
    }
}